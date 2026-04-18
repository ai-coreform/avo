import { pgEnum } from "drizzle-orm/pg-core";

export const menuAllergenValues = [
  "gluten",
  "crustaceans",
  "egg",
  "fish",
  "peanut",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulfites",
  "lupins",
  "shellfish",
] as const;

export const menuFeatureValues = [
  "frozen",
  "gluten_free",
  "blast_chilled",
  "spicy",
  "vegetarian",
  "vegan",
  "lactose_free",
  "organic",
  "halal",
  "new",
  "recommended",
] as const;

export const menuAdditiveValues = [
  "colorants",
  "preservatives",
  "antioxidants",
  "flavor_enhancers",
  "sulfide",
  "smoked",
  "waxed",
  "sweetener",
  "aspartame",
  "phenylalanine",
  "phosphate",
  "caffeine",
  "quinine",
] as const;

export const menuStatus = pgEnum("menu_status", [
  "draft",
  "published",
  "archived",
]);

export const menuEntryKind = pgEnum("menu_entry_kind", ["entry", "group"]);

export const menuAllergen = pgEnum("menu_allergen", menuAllergenValues);

export const menuFeature = pgEnum("menu_feature", menuFeatureValues);

export const menuAdditive = pgEnum("menu_additive", menuAdditiveValues);

export const weekday = pgEnum("weekday", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const translationEntityType = pgEnum("translation_entity_type", [
  "menu",
  "menu_tab",
  "menu_category",
  "menu_entry",
  "menu_subcategory",
  "catalog_item",
  "promotion",
  "promotion_component",
]);

export const translationStatus = pgEnum("translation_status", [
  "draft",
  "published",
  "stale",
]);

export const translatedBy = pgEnum("translated_by", ["manual", "system"]);
