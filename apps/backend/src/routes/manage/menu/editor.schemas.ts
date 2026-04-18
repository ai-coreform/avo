import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { catalogItem } from "@/db/schema/catalog-item";
import {
  menuAdditiveValues,
  menuAllergenValues,
  menuFeatureValues,
} from "@/db/schema/enum";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";

const MENU_TITLE_MAX_LENGTH = 120;
const MENU_DESCRIPTION_MAX_LENGTH = 500;
const MENU_PRICE_LABEL_MAX_LENGTH = 120;
const menuAllergenSchema = z.enum(menuAllergenValues);
const menuFeatureSchema = z.enum(menuFeatureValues);
const menuAdditiveSchema = z.enum(menuAdditiveValues);

function nullableTrimmedString(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : null;
    });
}

const translationFieldsSchema = z
  .object({
    title: nullableTrimmedString(MENU_TITLE_MAX_LENGTH),
    description: nullableTrimmedString(MENU_DESCRIPTION_MAX_LENGTH),
  })
  .strict();

const editorTranslationsSchema = z
  .record(z.string(), translationFieldsSchema)
  .default({});

const groupRowSchema = createInsertSchema(menuEntry)
  .pick({
    title: true,
    isVisible: true,
  })
  .extend({
    kind: z.literal("group"),
    id: z.string().uuid().nullable().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Group title is required")
      .max(MENU_TITLE_MAX_LENGTH, "Group title is too long"),
    translations: editorTranslationsSchema,
  })
  .strict();

const entryRowSchema = createInsertSchema(menuEntry)
  .pick({
    isVisible: true,
    priceCentsOverride: true,
    priceLabelOverride: true,
  })
  .extend(
    createInsertSchema(catalogItem).pick({
      title: true,
      description: true,
      priceCents: true,
      priceLabel: true,
    }).shape
  )
  .extend({
    kind: z.literal("entry"),
    id: z.string().uuid().nullable().optional(),
    catalogItemId: z.string().uuid().nullable().optional(),
    /**
     * UI-only hint: whether this entry's catalog_item is referenced by
     * other menus. The GET endpoint derives it and the editor rounds-trips
     * it back here. Accepted but ignored — the backend re-derives the
     * shared state from the DB inside `updateMenuEditor`.
     */
    isShared: z.boolean().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Entry title is required")
      .max(MENU_TITLE_MAX_LENGTH, "Entry title is too long"),
    description: nullableTrimmedString(MENU_DESCRIPTION_MAX_LENGTH),
    priceLabel: nullableTrimmedString(MENU_PRICE_LABEL_MAX_LENGTH),
    priceLabelOverride: nullableTrimmedString(MENU_PRICE_LABEL_MAX_LENGTH),
    allergens: z.array(menuAllergenSchema).default([]),
    features: z.array(menuFeatureSchema).default([]),
    additives: z.array(menuAdditiveSchema).default([]),
    imageUrl: z.string().trim().nullable().optional(),
    translations: editorTranslationsSchema,
  })
  .strict();

const editorRowSchema = z.discriminatedUnion("kind", [
  groupRowSchema,
  entryRowSchema,
]);

const editorCategorySchema = createInsertSchema(menuCategory)
  .pick({
    title: true,
    isVisible: true,
  })
  .extend({
    id: z.string().uuid().nullable().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Category title is required")
      .max(MENU_TITLE_MAX_LENGTH, "Category title is too long"),
    translations: editorTranslationsSchema,
    rows: z.array(editorRowSchema),
  })
  .strict();

const editorTabSchema = createInsertSchema(menuTab)
  .pick({
    label: true,
    isVisible: true,
  })
  .extend({
    id: z.string().uuid().nullable().optional(),
    label: z
      .string()
      .trim()
      .min(1, "Tab label is required")
      .max(MENU_TITLE_MAX_LENGTH, "Tab label is too long"),
    translations: editorTranslationsSchema,
    categories: z.array(editorCategorySchema),
  })
  .strict();

export const updateMenuEditorSchema = z
  .object({
    tabs: z.array(editorTabSchema),
    sharedCatalogStrategy: z.enum(["global", "local"]).optional(),
  })
  .strict();

export type UpdateMenuEditorPayload = z.infer<typeof updateMenuEditorSchema>;
