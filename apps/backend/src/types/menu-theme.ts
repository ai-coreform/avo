import { z } from "zod";

export const menuThemeSchema = z
  .object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    accentColor: z.string(),
    headerBg: z.string(),
    priceColor: z.string(),
    cardBg: z.string(),
    borderColor: z.string(),
    tabBg: z.string(),
    tabText: z.string(),
    tabActiveText: z.string(),
    promoGradient: z.string(),
    allergenColor: z.string(),
    allergenIconColor: z.string(),
    logoSize: z.number().min(20).max(48),
    fontDisplay: z.string(),
    fontBody: z.string(),
  })
  .partial();

export type MenuThemeData = z.infer<typeof menuThemeSchema>;
