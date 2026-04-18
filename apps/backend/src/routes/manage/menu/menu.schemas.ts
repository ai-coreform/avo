import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { menuStatus } from "@/db/schema/enum";
import { menu } from "@/db/schema/menu";
import { menuThemeSchema } from "@/types/menu-theme";

const MENU_NAME_MAX_LENGTH = 120;

const menuMutationSchema = createInsertSchema(menu).pick({
  name: true,
  status: true,
  sortOrder: true,
});

export const menuSelectSchema = createSelectSchema(menu);

export const menuNameSchema = z
  .string()
  .trim()
  .min(1, "Menu name is required")
  .max(
    MENU_NAME_MAX_LENGTH,
    `Menu name cannot exceed ${MENU_NAME_MAX_LENGTH} characters`
  );

export const menuStatusSchema = z.enum(menuStatus.enumValues);

export const createMenuSchema = menuMutationSchema
  .pick({
    name: true,
    status: true,
  })
  .extend({
    name: menuNameSchema,
    status: menuStatusSchema.optional(),
  })
  .strict();

export const updateMenuSchema = menuMutationSchema
  .extend({
    name: menuNameSchema.optional(),
    status: menuStatusSchema.optional(),
    sortOrder: z
      .number()
      .int("Sort order must be an integer")
      .min(0, "Sort order must be zero or greater")
      .optional(),
    theme: menuThemeSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const menuParamsSchema = z.object({
  menuSlug: z.string().min(1, "Menu slug is required"),
});

export type CreateMenuPayload = z.infer<typeof createMenuSchema>;
export type UpdateMenuPayload = z.infer<typeof updateMenuSchema>;
export type MenuParams = z.infer<typeof menuParamsSchema>;
