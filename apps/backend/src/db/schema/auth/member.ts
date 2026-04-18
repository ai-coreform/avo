import { sql } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { role } from "./enums";
import { user } from "./user";
import { venue } from "./venue";

export const member = pgTable(
  "member",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: role("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_venueId_idx").on(table.venueId),
    index("member_userId_idx").on(table.userId),
  ]
);
