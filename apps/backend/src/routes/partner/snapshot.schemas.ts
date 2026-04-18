import { z } from "zod";
import {
  additivesSchema,
  allergensSchema,
  externalIdSchema,
  featuresSchema,
} from "./common.schemas";

/**
 * Snapshot payload — the atomic tree used on initial import.
 *
 * Limits (mirrored in applySnapshot for runtime enforcement):
 *   catalog_items total   ≤ 2000
 *   menus total           ≤ 20
 *   tabs per menu         ≤ 20
 *   categories per tab    ≤ 50
 *   entries per category  ≤ 500
 *   body size             ≤ 8 MB (enforced at the transport layer)
 */

const snapshotCatalogItemSchema = z
  .object({
    external_id: z.string().min(1).max(128),
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

const snapshotEntrySchema = z
  .object({
    external_id: externalIdSchema,
    kind: z.enum(["entry", "group"]).optional(),
    title: z.string().min(1).max(200).nullish(),
    catalog_item_external_id: z.string().min(1).max(128).nullish(),
    sort_order: z.number().int().min(0).max(1_000_000).optional(),
    is_visible: z.boolean().optional(),
    price_cents_override: z.number().int().min(0).max(9_999_999).nullish(),
    price_label_override: z.string().max(50).nullish(),
  })
  .strict();

const snapshotCategorySchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    sort_order: z.number().int().min(0).max(1_000_000).optional(),
    is_visible: z.boolean().optional(),
    entries: z.array(snapshotEntrySchema).max(500).optional(),
  })
  .strict();

const snapshotTabSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    sort_order: z.number().int().min(0).max(1_000_000).optional(),
    is_visible: z.boolean().optional(),
    categories: z.array(snapshotCategorySchema).max(50).optional(),
  })
  .strict();

const snapshotMenuSchema = z
  .object({
    external_id: externalIdSchema,
    title: z.string().min(1).max(200),
    status: z.enum(["draft", "published", "archived"]).optional(),
    sort_order: z.number().int().min(0).max(1_000_000).optional(),
    tabs: z.array(snapshotTabSchema).max(20).optional(),
  })
  .strict();

export const snapshotBodySchema = z
  .object({
    catalog_items: z.array(snapshotCatalogItemSchema).max(2000).optional(),
    menus: z.array(snapshotMenuSchema).max(20).optional(),
  })
  .strict();

export type SnapshotBody = z.infer<typeof snapshotBodySchema>;
export type SnapshotCatalogItem = z.infer<typeof snapshotCatalogItemSchema>;
export type SnapshotMenu = z.infer<typeof snapshotMenuSchema>;
export type SnapshotTab = z.infer<typeof snapshotTabSchema>;
export type SnapshotCategory = z.infer<typeof snapshotCategorySchema>;
export type SnapshotEntry = z.infer<typeof snapshotEntrySchema>;
