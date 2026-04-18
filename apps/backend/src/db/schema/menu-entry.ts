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
import { catalogItem } from "./catalog-item";
import { menuEntryKind } from "./enum";
import { menu } from "./menu";
import { menuCategory } from "./menu-category";

export const menuEntry = pgTable(
  "menu_entry",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menu.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategory.id, { onDelete: "cascade" }),
    kind: menuEntryKind("kind").default("entry").notNull(),
    title: text("title"),
    catalogItemId: uuid("catalog_item_id").references(() => catalogItem.id, {
      onDelete: "cascade",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    priceCentsOverride: integer("price_cents_override"),
    priceLabelOverride: text("price_label_override"),
    externalId: text("external_id"),
    externalSource: text("external_source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_entry_menu_id_idx").on(table.menuId),
    index("menu_entry_category_id_idx").on(table.categoryId),
    index("menu_entry_catalog_item_id_idx").on(table.catalogItemId),
    uniqueIndex("menu_entry_external_uniq")
      .on(table.menuId, table.externalSource, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ]
);
