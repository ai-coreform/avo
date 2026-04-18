import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { venue } from "./auth/venue";
import { partner } from "./partner";

export const VENUE_LINK_STATUS_VALUES = [
  "pending_claim",
  "active",
  "revoked",
  "abandoned",
] as const;

export type VenueLinkStatus = (typeof VENUE_LINK_STATUS_VALUES)[number];

/**
 * Links a specific venue on Avo to a specific partner integration.
 * One link per (partner, venue). Carries the opaque `link_token` used as
 * the second auth header (`X-Avo-Venue-Link`).
 */
export const venueLink = pgTable(
  "venue_link",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partner.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    /** Opaque token presented via `X-Avo-Venue-Link` on venue-scoped calls. */
    linkToken: text("link_token").notNull(),
    /** Partner-side venue ID (e.g. Connect's internal venue identifier). */
    connectVenueId: text("connect_venue_id").notNull(),
    status: text("status").$type<VenueLinkStatus>().notNull(),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
    disconnectedAt: timestamp("disconnected_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("venue_link_partner_venue_uniq").on(
      table.partnerId,
      table.venueId
    ),
    uniqueIndex("venue_link_token_uniq").on(table.linkToken),
    uniqueIndex("venue_link_partner_connect_venue_uniq").on(
      table.partnerId,
      table.connectVenueId
    ),
    index("venue_link_status_idx").on(table.status),
  ]
);
