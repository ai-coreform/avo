import { z } from "zod";
import type { MenuEntityTranslations } from "@/api/menu/types";
import type { MenuSheetTranslations } from "./menu-translations";

const MENU_TITLE_MAX_LENGTH = 120;

const translationFieldSchema = z.object({
  title: z
    .string()
    .max(MENU_TITLE_MAX_LENGTH, "Il nome tradotto è troppo lungo")
    .optional(),
  description: z.string().optional(),
});

const translationsSchema = z
  .record(z.string(), translationFieldSchema)
  .optional()
  .default({});

export const menuTitleSheetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Il nome è obbligatorio")
    .max(MENU_TITLE_MAX_LENGTH, "Il nome è troppo lungo"),
  isVisible: z.boolean(),
  translations: translationsSchema,
});

export type MenuTitleSheetValues = z.output<typeof menuTitleSheetSchema>;
export type MenuTitleSheetFormValues = z.input<typeof menuTitleSheetSchema>;
export type MenuTitleSheetSubmitValues = Omit<
  MenuTitleSheetValues,
  "translations"
> & {
  translations: MenuEntityTranslations;
};
export type MenuTitleSheetTranslations = MenuSheetTranslations;
