import { z } from "zod";
import {
  menuAdditiveValues,
  menuAllergenValues,
  menuFeatureValues,
} from "@/db/schema/enum";

/**
 * Shared Zod building blocks for partner resource schemas.
 *
 * Enum arrays are pre-deduplicated and validated strictly — any unknown value
 * yields 422 `invalid_enum_value` at the route layer.
 */

export const allergensSchema = z.array(z.enum(menuAllergenValues)).optional();
export const featuresSchema = z.array(z.enum(menuFeatureValues)).optional();
export const additivesSchema = z.array(z.enum(menuAdditiveValues)).optional();

export const PARTNER_SOURCE: string = "connect";

/** External_id field shape. Nullable in DB, optional in input. */
export const externalIdSchema = z.string().min(1).max(128).optional();

/** ISO-8601 timestamp validator. */
export const iso8601Schema = z.string().datetime({ offset: true });

/** Query param `limit`. */
export const limitSchema = z.coerce.number().int().min(1).max(500).optional();

/** Query param `cursor`. */
export const cursorSchema = z.string().min(1).max(2048).optional();

/** Query param `is_active`. */
export const isActiveQuerySchema = z.coerce.boolean().optional();

/** Query param `external_source`. */
export const externalSourceQuerySchema = z.string().min(1).max(64).optional();

/** Query param `updated_since` (ISO 8601). */
export const updatedSinceQuerySchema = iso8601Schema.optional();

/** Common list query params. */
export const commonListQuerySchema = z.object({
  limit: limitSchema,
  cursor: cursorSchema,
  external_source: externalSourceQuerySchema,
  updated_since: updatedSinceQuerySchema,
});

export type CommonListQuery = z.infer<typeof commonListQuerySchema>;
