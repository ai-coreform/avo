import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { menu } from "./menu";

export const menuTab = pgTable(
  "menu_tab",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menu.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    slug: text("slug").notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
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
    index("menu_tab_menu_id_idx").on(table.menuId),
    uniqueIndex("menu_tab_menu_slug_idx").on(table.menuId, table.slug),
    uniqueIndex("menu_tab_external_uniq")
      .on(table.menuId, table.externalSource, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ]
);
