import { z } from "zod";
import {
  additivesSchema,
  allergensSchema,
  commonListQuerySchema,
  externalIdSchema,
  featuresSchema,
  isActiveQuerySchema,
} from "./common.schemas";

/** Shared fields across create + bulk item objects. */
const catalogItemFieldsSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullish(),
    price_cents: z.number().int().min(0).max(9_999_999).nullish(),
    price_label: z.string().max(50).nullish(),
    allergens: allergensSchema,
    features: featuresSchema,
    additives: additivesSchema,
    image_url: z.string().url().max(500).nullish(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const createCatalogItemBodySchema = catalogItemFieldsSchema;
export type CreateCatalogItemBody = z.infer<typeof createCatalogItemBodySchema>;

export const updateCatalogItemBodySchema = catalogItemFieldsSchema.partial();
export type UpdateCatalogItemBody = z.infer<typeof updateCatalogItemBodySchema>;

export const bulkCatalogItemSchema = catalogItemFieldsSchema.extend({
  external_id: z.string().min(1).max(128),
});

export const bulkCatalogItemsBodySchema = z
  .object({
    items: z.array(bulkCatalogItemSchema).min(1).max(500),
  })
  .strict();
export type BulkCatalogItemsBody = z.infer<typeof bulkCatalogItemsBodySchema>;

export const listCatalogItemsQuerySchema = commonListQuerySchema.extend({
  is_active: isActiveQuerySchema,
});
export type ListCatalogItemsQuery = z.infer<typeof listCatalogItemsQuerySchema>;
