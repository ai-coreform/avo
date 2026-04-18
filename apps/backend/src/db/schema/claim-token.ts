import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth/user";
import { venue } from "./auth/venue";
import { venueLink } from "./venue-link";

/**
 * One-time claim tokens issued on `POST /partner/provision`.
 *
 * The claim URL returned to the partner (`https://app.avomenu.com/claim/<token>`)
 * is what the restaurant owner clicks to activate their Avo account. On click
 * the dashboard marks the user + venue_link as active and burns the token.
 */
export const claimToken = pgTable(
  "claim_token",
  {
    /** Opaque token string, primary key for fast lookup from the claim URL. */
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    venueLinkId: uuid("venue_link_id")
      .notNull()
      .references(() => venueLink.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("claim_token_expires_at_idx").on(table.expiresAt),
    index("claim_token_venue_link_id_idx").on(table.venueLinkId),
  ]
);

/** Days after which an unclaimed token expires. */
export const CLAIM_TOKEN_TTL_DAYS = 7;

/** Prefix used when generating claim tokens (not validated server-side). */
export const CLAIM_TOKEN_PREFIX = "claim_";

/**
 * Helper: builds the public claim URL for a given token.
 * Host comes from `APP_URL` env var (dashboard origin).
 */
const TRAILING_SLASH = /\/$/;

export function buildClaimUrl(token: string): string {
  const base = process.env.APP_URL ?? "https://app.avomenu.com";
  return `${base.replace(TRAILING_SLASH, "")}/claim/${token}`;
}
