import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export interface PartnerFeatureFlags {
  allowProvisioning?: boolean;
  allowSnapshot?: boolean;
}

/**
 * External trusted partners (EMS, POS, etc.) that integrate with Avo via
 * the /api/partner namespace.
 *
 * For v1 we seed a single row per partner manually via `scripts/seed-partner.ts`.
 * No self-service UI yet.
 */
export const partner = pgTable(
  "partner",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** bcrypt hash of the active API key. Plaintext never stored. */
    apiKeyHash: text("api_key_hash").notNull(),
    /**
     * bcrypt hash of the previous API key kept valid for 24h after rotation.
     * Null when no rotation is pending.
     */
    apiKeyHashPrevious: text("api_key_hash_previous"),
    /**
     * When the previous key expires (and becomes invalid). Null when no
     * rotation is pending.
     */
    apiKeyPreviousExpiresAt: timestamp("api_key_previous_expires_at"),
    /** HTTPS URL Avo POSTs webhook events to. */
    webhookUrl: text("webhook_url").notNull(),
    /** Raw secret used as the HMAC key when signing outbound webhooks. */
    webhookSecret: text("webhook_secret").notNull(),
    /** Optional list of CIDRs allowed to call the partner API. Empty = any IP. */
    ipAllowlist: text("ip_allowlist")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    featureFlags: jsonb("feature_flags")
      .$type<PartnerFeatureFlags>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("partner_slug_uniq").on(table.slug)]
);
