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
import { venue } from "./auth/venue";
import { translatedBy, translationEntityType, translationStatus } from "./enum";

export const contentTranslation = pgTable(
  "content_translation",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    entityType: translationEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: text("locale").notNull(),
    fieldsJson: jsonb("fields_json")
      .$type<Record<string, string | null>>()
      .default({})
      .notNull(),
    sourceLocale: text("source_locale").notNull(),
    sourceRevision: integer("source_revision").notNull(),
    status: translationStatus("status").default("published").notNull(),
    translatedBy: translatedBy("translated_by").default("system").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("content_translation_venue_id_idx").on(table.venueId),
    index("content_translation_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    uniqueIndex("content_translation_entity_locale_idx").on(
      table.entityType,
      table.entityId,
      table.locale
    ),
  ]
);
