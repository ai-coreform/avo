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
import { venue } from "./auth/venue";
import { menuAdditive, menuAllergen, menuFeature } from "./enum";

export const catalogItem = pgTable(
  "catalog_item",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priceCents: integer("price_cents"),
    priceLabel: text("price_label"),
    allergens: menuAllergen("allergens")
      .array()
      .default(sql`'{}'::menu_allergen[]`)
      .notNull(),
    features: menuFeature("features")
      .array()
      .default(sql`'{}'::menu_feature[]`)
      .notNull(),
    additives: menuAdditive("additives")
      .array()
      .default(sql`'{}'::menu_additive[]`)
      .notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
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
    index("catalog_item_venue_id_idx").on(table.venueId),
    uniqueIndex("catalog_item_venue_slug_idx").on(table.venueId, table.slug),
    uniqueIndex("catalog_item_external_uniq")
      .on(table.venueId, table.externalSource, table.externalId)
      .where(sql`external_id IS NOT NULL`),
  ]
);
