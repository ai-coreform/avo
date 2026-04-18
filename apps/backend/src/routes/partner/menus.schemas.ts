import { z } from "zod";
import { commonListQuerySchema, externalIdSchema } from "./common.schemas";

export const menuStatusSchema = z.enum(["draft", "published", "archived"]);
export type MenuStatusInput = z.infer<typeof menuStatusSchema>;

/** Shared fields across create body. Strict — rejects `theme` or other
 * unknown fields since `theme` is dashboard-only. */
const menuFieldsSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    status: menuStatusSchema.optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .strict();

export const createMenuBodySchema = menuFieldsSchema;
export type CreateMenuBody = z.infer<typeof createMenuBodySchema>;

/** Update body: no external_id re-key allowed. */
export const updateMenuBodySchema = menuFieldsSchema
  .omit({ external_id: true })
  .partial()
  .strict();
export type UpdateMenuBody = z.infer<typeof updateMenuBodySchema>;

export const listMenusQuerySchema = commonListQuerySchema.extend({
  status: menuStatusSchema.optional(),
});
export type ListMenusQuery = z.infer<typeof listMenusQuerySchema>;
