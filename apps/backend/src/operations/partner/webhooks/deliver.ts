import { createHmac, randomUUID } from "node:crypto";
import { and, eq, lte, sql } from "drizzle-orm";
import database from "@/db";
import { partner as partnerTable } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";
import { webhookDelivery } from "@/db/schema/webhook-delivery";

/**
 * Schedule of delays (seconds) for each attempt after the first.
 * Attempt 1 fires immediately on enqueue; subsequent retries follow this.
 * After attempt 8, the delivery is dead-lettered.
 */
const RETRY_DELAYS_SECONDS = [
  60, // attempt 2 — 1 min after failure
  5 * 60, // attempt 3 — 5 min
  30 * 60, // attempt 4 — 30 min
  2 * 60 * 60, // attempt 5 — 2h
  6 * 60 * 60, // attempt 6 — 6h
  24 * 60 * 60, // attempt 7 — 24h
  24 * 60 * 60, // attempt 8 — 24h
];

const MAX_ATTEMPTS = RETRY_DELAYS_SECONDS.length + 1;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ERROR_EXCERPT_CHARS = 500;

interface DeliveryRow {
  id: string;
  partnerId: string;
  venueId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
}

interface DispatchableContext {
  partnerId: string;
  webhookUrl: string;
  webhookSecret: string;
  linkToken: string;
}

/**
 * Fetch a batch of due deliveries, claiming them with FOR UPDATE SKIP LOCKED
 * so parallel workers don't step on each other.
 */
export async function claimDueDeliveries(limit = 50): Promise<DeliveryRow[]> {
  // Two-step: select ids (with SKIP LOCKED), then UPDATE status to 'delivering'
  // and return the batch.
  const rows = await database.execute(sql`
    WITH due AS (
      SELECT id FROM webhook_delivery
      WHERE status = 'pending' AND next_attempt_at <= now()
      ORDER BY next_attempt_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE webhook_delivery
    SET status = 'delivering', updated_at = now()
    WHERE id IN (SELECT id FROM due)
    RETURNING id, partner_id, venue_id, event_type, payload, attempts
  `);

  // Bun-sql drizzle execute() returns result with rows at .rows or the array itself
  // depending on driver version. Normalize.
  const list = Array.isArray(rows)
    ? rows
    : ((rows as { rows?: unknown[] }).rows ?? []);

  return (list as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    partnerId: String(r.partner_id),
    venueId: String(r.venue_id),
    eventType: String(r.event_type),
    // bun-sql returns jsonb columns as unparsed strings when accessed via raw
    // SQL (`database.execute(...)`). Parse defensively so downstream code
    // always gets an object.
    payload: parsePayload(r.payload),
    attempts: Number(r.attempts ?? 0),
  }));
}

function parsePayload(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * Attempt to deliver a single webhook. Updates the row based on the outcome.
 */
export async function deliverOne(row: DeliveryRow): Promise<void> {
  const ctx = await loadDispatchContext(row);
  if (!ctx) {
    // Link gone or partner gone — park as failed permanently.
    await markDeadLetter(row.id, "context_missing", null);
    return;
  }

  const deliveryId = `whd_${randomUUID().replace(/-/g, "")}`;
  const attempt = row.attempts + 1;
  const timestamp = Math.floor(Date.now() / 1000);

  const finalPayload = {
    ...row.payload,
    delivery_id: deliveryId,
    link_token: ctx.linkToken,
  };
  const rawBody = JSON.stringify(finalPayload);
  const signature = signPayload(ctx.webhookSecret, timestamp, rawBody);

  const result = await postWebhook({
    url: ctx.webhookUrl,
    body: rawBody,
    signature,
    timestamp,
    deliveryId,
    eventType: row.eventType,
  });

  if (result.ok && result.status != null) {
    await markDelivered(row.id, result.status);
    return;
  }

  if (attempt >= MAX_ATTEMPTS) {
    await markDeadLetter(row.id, result.error, result.status);
    return;
  }

  const delaySec = RETRY_DELAYS_SECONDS[attempt - 1] ?? 60 * 60 * 24;
  const nextAttemptAt = new Date(
    Date.now() + Math.max(1, result.retryAfterSec ?? delaySec) * 1000
  );

  await markForRetry(
    row.id,
    attempt,
    nextAttemptAt,
    result.error,
    result.status
  );
}

// ──────────────────────────────────────────────────────────────
// HMAC signing
// ──────────────────────────────────────────────────────────────

export function signPayload(
  secret: string,
  timestamp: number,
  rawBody: string
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `sha256=${hmac.digest("hex")}`;
}

// ──────────────────────────────────────────────────────────────
// HTTP layer
// ──────────────────────────────────────────────────────────────

interface HttpResult {
  ok: boolean;
  status: number | null;
  error: string | null;
  retryAfterSec?: number;
}

async function postWebhook(args: {
  url: string;
  body: string;
  signature: string;
  timestamp: number;
  deliveryId: string;
  eventType: string;
}): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(args.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Avo-Webhook/1.0",
        "X-Avo-Delivery": args.deliveryId,
        "X-Avo-Timestamp": String(args.timestamp),
        "X-Avo-Signature": args.signature,
        "X-Avo-Event": args.eventType,
      },
      body: args.body,
      signal: controller.signal,
      redirect: "manual",
    });

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status, error: null };
    }

    const retryAfter = parseRetryAfterHeader(res.headers.get("retry-after"));
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: errText.slice(0, MAX_ERROR_EXCERPT_CHARS),
      retryAfterSec: retryAfter,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: null,
      error: msg.slice(0, MAX_ERROR_EXCERPT_CHARS),
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) {
    return;
  }
  const asNum = Number(value);
  if (Number.isFinite(asNum) && asNum > 0) {
    return Math.min(asNum, 6 * 60 * 60); // cap at 6h
  }
  const asDate = Date.parse(value);
  if (Number.isFinite(asDate)) {
    return Math.max(1, Math.floor((asDate - Date.now()) / 1000));
  }
  return;
}

// ──────────────────────────────────────────────────────────────
// State transitions
// ──────────────────────────────────────────────────────────────

async function loadDispatchContext(
  row: DeliveryRow
): Promise<DispatchableContext | null> {
  const [ctx] = await database
    .select({
      partnerId: partnerTable.id,
      webhookUrl: partnerTable.webhookUrl,
      webhookSecret: partnerTable.webhookSecret,
      linkToken: venueLink.linkToken,
    })
    .from(partnerTable)
    .innerJoin(
      venueLink,
      and(
        eq(venueLink.partnerId, partnerTable.id),
        eq(venueLink.venueId, row.venueId)
      )
    )
    .where(eq(partnerTable.id, row.partnerId))
    .limit(1);
  return ctx ?? null;
}

async function markDelivered(id: string, status: number): Promise<void> {
  await database
    .update(webhookDelivery)
    .set({
      status: "delivered",
      deliveredAt: new Date(),
      lastStatus: status,
      lastError: null,
    })
    .where(eq(webhookDelivery.id, id));
}

async function markForRetry(
  id: string,
  newAttempts: number,
  nextAttemptAt: Date,
  error: string | null,
  status: number | null
): Promise<void> {
  await database
    .update(webhookDelivery)
    .set({
      status: "pending",
      attempts: newAttempts,
      nextAttemptAt,
      lastStatus: status,
      lastError: error,
    })
    .where(eq(webhookDelivery.id, id));
}

async function markDeadLetter(
  id: string,
  error: string | null,
  status: number | null
): Promise<void> {
  await database
    .update(webhookDelivery)
    .set({
      status: "dead_letter",
      attempts: MAX_ATTEMPTS,
      lastStatus: status,
      lastError: error,
    })
    .where(eq(webhookDelivery.id, id));
}

/**
 * Process a single batch of due deliveries. Called by the worker loop.
 * Returns the number of rows processed.
 */
export async function processBatch(batchSize = 25): Promise<number> {
  const rows = await claimDueDeliveries(batchSize);
  if (rows.length === 0) {
    return 0;
  }
  await Promise.all(rows.map((row) => deliverOne(row)));
  return rows.length;
}

/**
 * Sweep for deliveries stuck in 'delivering' state for >60s — usually means
 * a worker crashed mid-attempt. Revert to 'pending' so another worker picks up.
 */
export async function unstickStaleDelivering(): Promise<void> {
  const stuckBefore = new Date(Date.now() - 60_000);
  await database
    .update(webhookDelivery)
    .set({ status: "pending" })
    .where(
      and(
        eq(webhookDelivery.status, "delivering"),
        lte(webhookDelivery.updatedAt, stuckBefore)
      )
    );
}
