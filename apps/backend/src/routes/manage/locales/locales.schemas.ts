import { z } from "zod";

export const addLocaleSchema = z.object({
  locale: z.string().min(2).max(5),
});

export const reorderLocalesSchema = z.object({
  locales: z.array(z.string().min(2).max(5)),
});

export const toggleLocaleSchema = z.object({
  isEnabled: z.boolean(),
});

export const localeParamSchema = z.object({
  locale: z.string().min(2).max(5),
});
