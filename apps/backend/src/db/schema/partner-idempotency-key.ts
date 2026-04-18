import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { partner } from "./partner";

/**
 * Records partner API responses keyed by `Idempotency-Key` so retries of the
 * same request return the stored response instead of re-executing the operation.
 *
 * Retention: 24 hours. A background job purges expired rows.
 */
export const partnerIdempotencyKey = pgTable(
  "partner_idempotency_key",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partner.id, { onDelete: "cascade" }),
    /** Value of the `Idempotency-Key` header. Opaque string, typically a UUID v4. */
    key: text("key").notNull(),
    /** HTTP method + path fingerprint, so the same key on a different route is still a miss. */
    requestFingerprint: text("request_fingerprint").notNull(),
    /** Cached response status. */
    responseStatus: integer("response_status").notNull(),
    /** Cached response body (JSON). */
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    uniqueIndex("partner_idempotency_key_partner_key_uniq").on(
      table.partnerId,
      table.key
    ),
    index("partner_idempotency_key_expires_at_idx").on(table.expiresAt),
  ]
);

/** Hours after which idempotency records expire. */
export const IDEMPOTENCY_RETENTION_HOURS = 24;
