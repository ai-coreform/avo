import { and, eq, lt } from "drizzle-orm";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import {
  IDEMPOTENCY_RETENTION_HOURS,
  partnerIdempotencyKey,
} from "@/db/schema/partner-idempotency-key";

const IDEMPOTENCY_HEADER = "idempotency-key";
const UNSAFE_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

export interface PartnerIdempotencyOptions {
  /**
   * When true, reject unsafe requests that don't include an Idempotency-Key
   * with HTTP 400. Default: false (key is optional but honored when present).
   *
   * Setting this to true is recommended on high-value endpoints like
   * /provision and /catalog:snapshot.
   */
  require?: boolean;
}

function missingKeyError(): HTTPException {
  return new HTTPException(400, {
    message: JSON.stringify({
      error: {
        code: "missing_idempotency_key",
        message:
          "This endpoint requires an Idempotency-Key header (UUID v4 recommended).",
      },
    }),
  });
}

function keyReusedError(): HTTPException {
  return new HTTPException(400, {
    message: JSON.stringify({
      error: {
        code: "idempotency_key_reused",
        message: "Idempotency-Key was previously used on a different route.",
      },
    }),
  });
}

async function lookupExisting(partnerId: string, key: string) {
  const [row] = await database
    .select()
    .from(partnerIdempotencyKey)
    .where(
      and(
        eq(partnerIdempotencyKey.partnerId, partnerId),
        eq(partnerIdempotencyKey.key, key)
      )
    )
    .limit(1);
  return row ?? null;
}

async function cacheResponse(args: {
  c: Context;
  partnerId: string;
  key: string;
  fingerprint: string;
}) {
  const { c, partnerId, key, fingerprint } = args;
  const status = c.res.status;
  if (status >= 500) {
    return;
  }

  let body: unknown;
  try {
    const cloned = c.res.clone();
    body = await cloned.json();
  } catch {
    // Non-JSON response (e.g. 204 empty). Don't cache.
    return;
  }

  const expiresAt = new Date(
    Date.now() + IDEMPOTENCY_RETENTION_HOURS * 60 * 60 * 1000
  );

  await database
    .insert(partnerIdempotencyKey)
    .values({
      partnerId,
      key,
      requestFingerprint: fingerprint,
      responseStatus: status,
      responseBody: body as Record<string, unknown>,
      expiresAt,
    })
    .onConflictDoNothing();
}

/**
 * Partner idempotency: if the same Idempotency-Key is presented twice within
 * 24h by the same partner for the same route+method, the second call returns
 * the cached response instead of re-executing.
 *
 * Must run after `requirePartner()`.
 */
export const partnerIdempotency = (opts: PartnerIdempotencyOptions = {}) =>
  createMiddleware(async (c, next) => {
    const method = c.req.method.toUpperCase();
    if (!UNSAFE_METHODS.has(method)) {
      await next();
      return;
    }

    const partnerRow = c.get("partner");
    if (!partnerRow) {
      throw new HTTPException(500, {
        message: "partnerIdempotency used without requirePartner",
      });
    }

    const key = c.req.header(IDEMPOTENCY_HEADER);
    if (!key) {
      if (opts.require) {
        throw missingKeyError();
      }
      await next();
      return;
    }

    const fingerprint = `${method} ${c.req.path}`;
    const existing = await lookupExisting(partnerRow.id, key);

    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        throw keyReusedError();
      }
      if (existing.expiresAt > new Date()) {
        c.status(existing.responseStatus as Parameters<typeof c.status>[0]);
        return c.json(existing.responseBody as Record<string, unknown>);
      }
    }

    await next();
    await cacheResponse({ c, partnerId: partnerRow.id, key, fingerprint });
  });

/**
 * Cleanup job: remove idempotency keys past their expiration.
 * Intended to run hourly from the worker.
 */
export async function purgeExpiredIdempotencyKeys() {
  await database
    .delete(partnerIdempotencyKey)
    .where(lt(partnerIdempotencyKey.expiresAt, new Date()));
}
