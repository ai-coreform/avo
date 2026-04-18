import { z } from "zod";
import { externalIdSchema } from "./common.schemas";

/** Base fields shared between create + update (excluding tab targeting). */
const menuCategoryBaseFieldsSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    is_visible: z.boolean().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    tab_id: z.string().uuid().optional(),
    tab_external_id: z.string().min(1).max(128).optional(),
  })
  .strict();

/**
 * Create body. Enforces exactly one of `tab_id` or `tab_external_id`.
 * Using a refinement so zod reports the violation as `invalid_payload`
 * at the route layer.
 */
export const createMenuCategoryBodySchema = menuCategoryBaseFieldsSchema.refine(
  (v) => {
    const hasId = typeof v.tab_id === "string" && v.tab_id.length > 0;
    const hasExt =
      typeof v.tab_external_id === "string" && v.tab_external_id.length > 0;
    return (hasId ? 1 : 0) + (hasExt ? 1 : 0) === 1;
  },
  {
    message: "Provide exactly one of tab_id or tab_external_id.",
    path: ["tab_id"],
  }
);
export type CreateMenuCategoryBody = z.infer<
  typeof createMenuCategoryBodySchema
>;

/**
 * Update body. All fields optional. `tab_id` / `tab_external_id` are
 * mutually exclusive (move to another tab), but neither is required. If
 * both are present → reject.
 */
export const updateMenuCategoryBodySchema = menuCategoryBaseFieldsSchema
  .omit({ external_id: true })
  .partial()
  .refine(
    (v) => {
      const hasId = typeof v.tab_id === "string" && v.tab_id.length > 0;
      const hasExt =
        typeof v.tab_external_id === "string" && v.tab_external_id.length > 0;
      return !(hasId && hasExt);
    },
    {
      message: "Provide only one of tab_id or tab_external_id.",
      path: ["tab_id"],
    }
  );
export type UpdateMenuCategoryBody = z.infer<
  typeof updateMenuCategoryBodySchema
>;

/** Query params for list: optional `tab_id` or `tab_external_id` filter. */
export const listMenuCategoriesQuerySchema = z
  .object({
    tab_id: z.string().uuid().optional(),
    tab_external_id: z.string().min(1).max(128).optional(),
  })
  .strict();
export type ListMenuCategoriesQuery = z.infer<
  typeof listMenuCategoriesQuerySchema
>;
