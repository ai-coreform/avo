import { z } from "zod";
import type { MenuEntityTranslations } from "@/api/menu/types";
import {
  menuEntryAdditiveValues,
  menuEntryAllergenValues,
  menuEntryFeatureValues,
} from "@/api/menu-entry/data";
import type { MenuSheetTranslations } from "./menu-translations";

const MENU_TITLE_MAX_LENGTH = 120;
const MENU_DESCRIPTION_MAX_LENGTH = 500;
const MENU_PRICE_LABEL_MAX_LENGTH = 120;

function isValidPrice(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  return Number.isFinite(Number(trimmed.replace(",", ".")));
}

const translationFieldSchema = z.object({
  title: z
    .string()
    .max(MENU_TITLE_MAX_LENGTH, "Il nome tradotto è troppo lungo")
    .optional(),
  description: z
    .string()
    .max(MENU_DESCRIPTION_MAX_LENGTH, "La descrizione tradotta è troppo lunga")
    .optional(),
});

const translationsSchema = z
  .record(z.string(), translationFieldSchema)
  .optional()
  .default({});

export const menuEntrySheetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Il nome della voce è obbligatorio")
    .max(MENU_TITLE_MAX_LENGTH, "Il nome della voce è troppo lungo"),
  description: z
    .string()
    .max(MENU_DESCRIPTION_MAX_LENGTH, "La descrizione è troppo lunga"),
  priceCents: z.string().refine(isValidPrice, {
    message: "Inserisci un prezzo valido",
  }),
  priceLabel: z
    .string()
    .max(MENU_PRICE_LABEL_MAX_LENGTH, "L'etichetta prezzo è troppo lunga"),
  isVisible: z.boolean(),
  allergens: z.array(z.enum(menuEntryAllergenValues)),
  features: z.array(z.enum(menuEntryFeatureValues)),
  additives: z.array(z.enum(menuEntryAdditiveValues)),
  imageUrl: z.string().nullable().optional(),
  translations: translationsSchema,
});

export type MenuEntrySheetValues = z.output<typeof menuEntrySheetSchema>;
export type MenuEntrySheetFormValues = z.input<typeof menuEntrySheetSchema>;
export type MenuEntrySheetSubmitValues = Omit<
  MenuEntrySheetValues,
  "translations"
> & {
  translations: MenuEntityTranslations;
};
export type MenuEntrySheetTranslations = MenuSheetTranslations;
