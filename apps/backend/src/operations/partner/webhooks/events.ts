import { and, eq, inArray } from "drizzle-orm";
import database from "@/db";
import { partner } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";
import { webhookDelivery } from "@/db/schema/webhook-delivery";

/**
 * Outbound webhook event catalog.
 *
 * These identifiers match `docs/partners/connect/webhooks.md#catalogo-eventi`.
 */
export const WEBHOOK_EVENT_TYPES = [
  "catalog.item.created",
  "catalog.item.updated",
  "catalog.item.deleted",
  "catalog.category.created",
  "catalog.category.updated",
  "catalog.category.deleted",
  "catalog.modifier.created", // reserved for future use
  "catalog.modifier.updated",
  "catalog.modifier.deleted",
  "menu.created",
  "menu.updated",
  "menu.deleted",
  "menu_tab.created",
  "menu_tab.updated",
  "menu_tab.deleted",
  "menu_category.created",
  "menu_category.updated",
  "menu_category.deleted",
  "menu_entry.created",
  "menu_entry.updated",
  "menu_entry.deleted",
  "link.revoked",
  "provision.abandoned",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WEBHOOK_PAYLOAD_SCHEMA_VERSION = 1;

/**
 * Payload structure sent to partner webhooks. Metadata only — consumers
 * are expected to GET the resource separately for current state.
 */
export interface WebhookEventPayload {
  schema_version: number;
  event: WebhookEventType;
  delivery_id: string; // filled in at delivery time
  occurred_at: string;
  venue_id: string;
  link_token: string; // filled in at delivery time
  resource: ResourceMetadata;
}

interface ResourceMetadata {
  type:
    | "catalog_item"
    | "menu"
    | "menu_tab"
    | "menu_category"
    | "menu_entry"
    | "venue_link";
  avo_id?: string;
  external_id?: string | null;
  menu_id?: string;
  connect_venue_id?: string;
  reason?: string;
}

/**
 * Event emission arguments — passed by the operation that performed the
 * mutation. `source` identifies who made the change and is used for echo
 * suppression.
 */
export interface EmitEventArgs {
  venueId: string;
  eventType: WebhookEventType;
  resource: ResourceMetadata;
  /**
   * Who caused the change. Known values:
   * - "dashboard" — Avo user via the /manage API.
   * - `partner:<slug>` — a partner via the /partner API.
   * - "system" — internal background jobs, cleanups, etc.
   *
   * Events whose source matches a subscribing partner's slug are skipped
   * to prevent echoing back.
   */
  source: string;
  /**
   * When true, suppress delivery for all partners. Used by the
   * `X-Avo-Import: true` flag on snapshot / bulk import requests.
   */
  suppress?: boolean;
}

/**
 * Insert webhook_delivery rows for every partner linked to this venue whose
 * echo suppression doesn't apply.
 *
 * Must be called AFTER the DB transaction commits — this function opens its
 * own writes. If you're already in a transaction, pass the tx via
 * `enqueueEventWithTx`.
 */
export async function emitEvent(args: EmitEventArgs): Promise<void> {
  if (args.suppress) {
    return;
  }

  const links = await findActiveLinks(args.venueId);
  for (const link of links) {
    if (shouldSkipForEchoSuppression(args.source, link.partnerSlug)) {
      continue;
    }
    await database.insert(webhookDelivery).values({
      partnerId: link.partnerId,
      venueId: args.venueId,
      eventType: args.eventType,
      payload: buildPayload(args, link.venueId),
      status: "pending",
    });
  }
}

async function findActiveLinks(
  venueId: string
): Promise<Array<{ partnerId: string; partnerSlug: string; venueId: string }>> {
  const rows = await database
    .select({
      partnerId: venueLink.partnerId,
      partnerSlug: partner.slug,
      venueId: venueLink.venueId,
    })
    .from(venueLink)
    .innerJoin(partner, eq(partner.id, venueLink.partnerId))
    .where(and(eq(venueLink.venueId, venueId), eq(venueLink.status, "active")));
  return rows;
}

function shouldSkipForEchoSuppression(
  source: string,
  partnerSlug: string
): boolean {
  const prefix = "partner:";
  if (!source.startsWith(prefix)) {
    return false;
  }
  const sourceSlug = source.slice(prefix.length);
  return sourceSlug === partnerSlug;
}

function buildPayload(
  args: EmitEventArgs,
  venueId: string
): Record<string, unknown> {
  return {
    schema_version: WEBHOOK_PAYLOAD_SCHEMA_VERSION,
    event: args.eventType,
    occurred_at: new Date().toISOString(),
    venue_id: venueId,
    resource: args.resource,
  };
}

/** Escape hatch for callers that want to delete many pending rows in one shot. */
export async function deletePendingDeliveriesForLinkRevocation(
  partnerId: string,
  venueId: string
): Promise<void> {
  await database
    .delete(webhookDelivery)
    .where(
      and(
        eq(webhookDelivery.partnerId, partnerId),
        eq(webhookDelivery.venueId, venueId),
        inArray(webhookDelivery.status, ["pending", "failed"])
      )
    );
}

/**
 * Targeted emit to a specific partner. Bypasses echo suppression — use for
 * lifecycle events (link.revoked, provision.abandoned) where the partner
 * always wants the confirmation even if they initiated the action.
 */
export async function emitEventToPartner(args: {
  partnerId: string;
  venueId: string;
  eventType: WebhookEventType;
  resource: ResourceMetadata;
}): Promise<void> {
  await database.insert(webhookDelivery).values({
    partnerId: args.partnerId,
    venueId: args.venueId,
    eventType: args.eventType,
    payload: {
      schema_version: WEBHOOK_PAYLOAD_SCHEMA_VERSION,
      event: args.eventType,
      occurred_at: new Date().toISOString(),
      venue_id: args.venueId,
      resource: args.resource,
    },
    status: "pending",
  });
}
