import { z } from "zod";

export const menuParamSchema = z.object({
  venueSlug: z.string().min(1, "Venue slug is required"),
  menuSlug: z.string().min(1, "Menu slug is required"),
});

export const translationParamsSchema = z.object({
  venueSlug: z.string().min(1, "Venue slug is required"),
  menuSlug: z.string().min(1, "Menu slug is required"),
  locale: z.string().min(2, "Locale is required"),
});

export const resolveVenueParamSchema = z.object({
  venueSlug: z.string().min(1, "Venue slug is required"),
});

export type MenuParam = z.infer<typeof menuParamSchema>;
export type TranslationParams = z.infer<typeof translationParamsSchema>;
