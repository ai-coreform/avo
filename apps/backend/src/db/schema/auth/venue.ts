import { sql } from "drizzle-orm";
import {
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export interface VenueSocials {
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
}

export const venue = pgTable("venue", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  timezone: text("timezone").default("Europe/Rome").notNull(),
  defaultLocale: text("default_locale").default("it").notNull(),
  sourceLocale: text("source_locale").default("it").notNull(),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),

  // Social links
  socials: jsonb("socials").$type<VenueSocials>(),

  // Address fields
  address: text("address"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  region: text("region"),
  postalCode: text("postal_code"),
  country: text("country"),
  countryCode: text("country_code"),
  placeId: text("place_id"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
