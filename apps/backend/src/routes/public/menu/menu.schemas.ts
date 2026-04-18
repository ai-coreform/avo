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

export const resolveMenuParamSchema = z.object({
  menuId: z.string().uuid("Invalid menu ID"),
});

export type MenuParam = z.infer<typeof menuParamSchema>;
export type TranslationParams = z.infer<typeof translationParamsSchema>;
export type ResolveMenuParam = z.infer<typeof resolveMenuParamSchema>;
