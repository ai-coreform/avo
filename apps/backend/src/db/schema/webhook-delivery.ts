import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { venue } from "./auth/venue";
import { partner } from "./partner";

export const WEBHOOK_DELIVERY_STATUS_VALUES = [
  "pending",
  "delivering",
  "delivered",
  "failed",
  "dead_letter",
] as const;

export type WebhookDeliveryStatus =
  (typeof WEBHOOK_DELIVERY_STATUS_VALUES)[number];

/**
 * Queue of outbound webhook deliveries.
 *
 * Lifecycle: pending → delivering → (delivered | failed → pending | dead_letter)
 *
 * The worker polls `WHERE status = 'pending' AND next_attempt_at <= now()`
 * with `FOR UPDATE SKIP LOCKED`, signs the payload, POSTs to the partner's
 * webhook_url, and updates the row based on the response.
 */
export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partner.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    /** Event type (e.g. `catalog.item.updated`). */
    eventType: text("event_type").notNull(),
    /** Canonical payload as documented in docs/partners/connect/webhooks.md. */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").$type<WebhookDeliveryStatus>().notNull(),
    attempts: integer("attempts").default(0).notNull(),
    /** Earliest time the worker can (re-)attempt delivery. */
    nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
    /** Populated on final success. */
    deliveredAt: timestamp("delivered_at"),
    /** HTTP status code of the last attempt (null before any attempt). */
    lastStatus: integer("last_status"),
    /** Short error message from the last attempt (network error or body excerpt). */
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_delivery_pending_idx").on(table.status, table.nextAttemptAt),
    index("webhook_delivery_partner_venue_idx").on(
      table.partnerId,
      table.venueId
    ),
    index("webhook_delivery_event_type_idx").on(table.eventType),
  ]
);
