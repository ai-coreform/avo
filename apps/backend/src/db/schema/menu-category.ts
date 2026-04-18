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
import { menuTab } from "./menu-tab";

export const menuCategory = pgTable(
  "menu_category",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menu.id, { onDelete: "cascade" }),
    tabId: uuid("tab_id")
      .notNull()
      .references(() => menuTab.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
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
    index("menu_category_menu_id_idx").on(table.menuId),
    index("menu_category_tab_id_idx").on(table.tabId),
    uniqueIndex("menu_category_menu_slug_idx").on(table.menuId, table.slug),
    uniqueIndex("menu_category_external_uniq")
      .on(table.menuId, table.externalSource, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ]
);
