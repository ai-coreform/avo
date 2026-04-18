import { z } from "zod";
import { externalIdSchema } from "./common.schemas";

const menuTabFieldsSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    is_visible: z.boolean().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .strict();

export const createMenuTabBodySchema = menuTabFieldsSchema;
export type CreateMenuTabBody = z.infer<typeof createMenuTabBodySchema>;

export const updateMenuTabBodySchema = menuTabFieldsSchema
  .omit({ external_id: true })
  .partial()
  .strict();
export type UpdateMenuTabBody = z.infer<typeof updateMenuTabBodySchema>;
