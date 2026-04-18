import type { catalogItem } from "@/db/schema/catalog-item";
import type { menu } from "@/db/schema/menu";
import type { menuCategory } from "@/db/schema/menu-category";
import type { menuEntry } from "@/db/schema/menu-entry";
import type { menuTab } from "@/db/schema/menu-tab";

/**
 * Converts DB rows (camelCase Drizzle types) into the snake_case JSON shape
 * documented in docs/partners/connect/data-model.md. Concentrated here so
 * every endpoint that returns these resources stays consistent.
 */

export function serializeCatalogItem(row: typeof catalogItem.$inferSelect) {
  return {
    id: row.id,
    venue_id: row.venueId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price_cents: row.priceCents,
    price_label: row.priceLabel,
    allergens: row.allergens,
    features: row.features,
    additives: row.additives,
    image_url: row.imageUrl,
    is_active: row.isActive,
    external_id: row.externalId,
    external_source: row.externalSource,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeMenu(row: typeof menu.$inferSelect) {
  return {
    id: row.id,
    venue_id: row.venueId,
    title: row.name,
    slug: row.slug,
    status: row.status,
    sort_order: row.sortOrder,
    published_at: row.publishedAt ? row.publishedAt.toISOString() : null,
    external_id: row.externalId,
    external_source: row.externalSource,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeMenuTab(row: typeof menuTab.$inferSelect) {
  return {
    id: row.id,
    menu_id: row.menuId,
    title: row.label,
    slug: row.slug,
    is_visible: row.isVisible,
    sort_order: row.sortOrder,
    external_id: row.externalId,
    external_source: row.externalSource,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeMenuCategory(row: typeof menuCategory.$inferSelect) {
  return {
    id: row.id,
    menu_id: row.menuId,
    tab_id: row.tabId,
    title: row.title,
    slug: row.slug,
    is_visible: row.isVisible,
    sort_order: row.sortOrder,
    external_id: row.externalId,
    external_source: row.externalSource,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeMenuEntry(row: typeof menuEntry.$inferSelect) {
  return {
    id: row.id,
    menu_id: row.menuId,
    category_id: row.categoryId,
    kind: row.kind,
    title: row.title,
    catalog_item_id: row.catalogItemId,
    sort_order: row.sortOrder,
    is_visible: row.isVisible,
    price_cents_override: row.priceCentsOverride,
    price_label_override: row.priceLabelOverride,
    external_id: row.externalId,
    external_source: row.externalSource,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
