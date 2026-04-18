import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { catalogItem } from "./catalog-item";
import { promotion } from "./promotion";

export const promotionComponent = pgTable(
  "promotion_component",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    promotionId: uuid("promotion_id")
      .notNull()
      .references(() => promotion.id, { onDelete: "cascade" }),
    catalogItemId: uuid("catalog_item_id").references(() => catalogItem.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name"),
    quantity: integer("quantity").default(1).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    sourceRevision: integer("source_revision").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_component_promotion_id_idx").on(table.promotionId),
    index("promotion_component_catalog_item_id_idx").on(table.catalogItemId),
  ]
);
