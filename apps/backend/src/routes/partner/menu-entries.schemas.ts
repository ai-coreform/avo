import { z } from "zod";
import { commonListQuerySchema, externalIdSchema } from "./common.schemas";

/**
 * Menu entry schemas.
 *
 * A menu entry can be either:
 * - `kind: "entry"` — references a catalog_item. Exactly one of
 *   `catalog_item_id` / `catalog_item_external_id` must be provided.
 * - `kind: "group"` — a section header with `title`, no catalog_item.
 *
 * Category reference: exactly one of `category_id` / `category_external_id`
 * must be provided on create. Either may be provided on update (to move the
 * entry to another category of the same menu).
 */

const baseEntryShape = z.object({
  external_id: externalIdSchema,
  kind: z.enum(["entry", "group"]).optional(),
  title: z.string().min(1).max(200).nullish(),
  category_id: z.string().uuid().optional(),
  category_external_id: z.string().min(1).max(128).optional(),
  catalog_item_id: z.string().uuid().nullish(),
  catalog_item_external_id: z.string().min(1).max(128).nullish(),
  sort_order: z.number().int().min(0).max(1_000_000).optional(),
  is_visible: z.boolean().optional(),
  price_cents_override: z.number().int().min(0).max(9_999_999).nullish(),
  price_label_override: z.string().max(50).nullish(),
});

export const createMenuEntryBodySchema = baseEntryShape
  .strict()
  .refine(
    (data) => Boolean(data.category_id) !== Boolean(data.category_external_id),
    {
      message:
        "Exactly one of category_id or category_external_id must be provided.",
      path: ["category_id"],
    }
  );

export type CreateMenuEntryBody = z.infer<typeof createMenuEntryBodySchema>;

export const updateMenuEntryBodySchema = baseEntryShape
  .partial()
  .strict()
  .refine(
    (data) => {
      // Only one of category_id/category_external_id may be set on update
      // (but both optional).
      if (data.category_id && data.category_external_id) {
        return false;
      }
      return true;
    },
    {
      message:
        "Provide at most one of category_id or category_external_id on update.",
      path: ["category_id"],
    }
  );

export type UpdateMenuEntryBody = z.infer<typeof updateMenuEntryBodySchema>;

export const listMenuEntriesQuerySchema = commonListQuerySchema.extend({
  category_id: z.string().uuid().optional(),
  category_external_id: z.string().min(1).max(128).optional(),
});

export type ListMenuEntriesQuery = z.infer<typeof listMenuEntriesQuerySchema>;
