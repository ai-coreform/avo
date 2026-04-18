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
import type { MenuThemeData } from "../../types/menu-theme";
import { venue } from "./auth/venue";
import { menuStatus } from "./enum";

export const menu = pgTable(
  "menu",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: menuStatus("status").default("draft").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    publishedAt: timestamp("published_at"),
    theme: jsonb("theme").$type<MenuThemeData>().default({}).notNull(),
    sourceRevision: integer("source_revision").default(1).notNull(),
    externalId: text("external_id"),
    externalSource: text("external_source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_venue_id_idx").on(table.venueId),
    index("menu_status_idx").on(table.status),
    uniqueIndex("menu_venue_slug_uniq").on(table.venueId, table.slug),
    uniqueIndex("menu_external_uniq")
      .on(table.venueId, table.externalSource, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ]
);
