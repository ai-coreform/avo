import { and, desc, eq, gte, lt } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
} from "./shared/pagination";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type MenuEntryRow = typeof menuEntry.$inferSelect;
type MenuEntryKind = MenuEntryRow["kind"];

export interface CreateMenuEntryInput {
  externalId?: string;
  kind: MenuEntryKind;
  title?: string | null;
  /** Resolved category UUID. */
  categoryId: string;
  /** Resolved catalog item UUID (nullable for `group` kind). */
  catalogItemId: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  priceCentsOverride?: number | null;
  priceLabelOverride?: string | null;
}

export type UpdateMenuEntryInput = Partial<
  Pick<
    CreateMenuEntryInput,
    | "title"
    | "sortOrder"
    | "isVisible"
    | "priceCentsOverride"
    | "priceLabelOverride"
    | "categoryId"
  >
>;

export interface ListMenuEntriesOptions {
  limit?: number;
  cursor?: string;
  categoryId?: string;
  externalSource?: string;
  updatedSince?: Date;
}

// ──────────────────────────────────────────────────────────────
// Reference resolution
// ──────────────────────────────────────────────────────────────

/** Ensures a category exists and belongs to the target menu. */
export async function getCategoryForMenu(
  menuId: string,
  categoryId: string
): Promise<typeof menuCategory.$inferSelect | null> {
  const [row] = await database
    .select()
    .from(menuCategory)
    .where(
      and(eq(menuCategory.menuId, menuId), eq(menuCategory.id, categoryId))
    )
    .limit(1);
  return row ?? null;
}

/** Resolve a category by external_id within the target menu. */
export async function getCategoryByExternalId(
  menuId: string,
  externalId: string,
  source: string = PARTNER_SOURCE
): Promise<typeof menuCategory.$inferSelect | null> {
  const [row] = await database
    .select()
    .from(menuCategory)
    .where(
      and(
        eq(menuCategory.menuId, menuId),
        eq(menuCategory.externalSource, source),
        eq(menuCategory.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

/** Resolve a catalog_item by Avo UUID, scoped to venue. */
export async function getCatalogItemScoped(
  venueId: string,
  catalogItemId: string
): Promise<typeof catalogItem.$inferSelect | null> {
  const [row] = await database
    .select()
    .from(catalogItem)
    .where(
      and(eq(catalogItem.venueId, venueId), eq(catalogItem.id, catalogItemId))
    )
    .limit(1);
  return row ?? null;
}

/** Resolve a catalog_item by external_id, scoped to venue. */
export async function getCatalogItemByExternalIdScoped(
  venueId: string,
  externalId: string,
  source: string = PARTNER_SOURCE
): Promise<typeof catalogItem.$inferSelect | null> {
  const [row] = await database
    .select()
    .from(catalogItem)
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        eq(catalogItem.externalSource, source),
        eq(catalogItem.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function getMenuEntryById(
  menuId: string,
  id: string
): Promise<MenuEntryRow | null> {
  const [row] = await database
    .select()
    .from(menuEntry)
    .where(and(eq(menuEntry.menuId, menuId), eq(menuEntry.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMenuEntryByExternalId(
  menuId: string,
  externalId: string,
  source: string = PARTNER_SOURCE
): Promise<MenuEntryRow | null> {
  const [row] = await database
    .select()
    .from(menuEntry)
    .where(
      and(
        eq(menuEntry.menuId, menuId),
        eq(menuEntry.externalSource, source),
        eq(menuEntry.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listMenuEntries(
  menuId: string,
  opts: ListMenuEntriesOptions = {}
): Promise<{ items: MenuEntryRow[]; nextCursor: string | null }> {
  const limit = normalizeLimit(opts.limit);
  const conditions = [eq(menuEntry.menuId, menuId)];

  if (opts.categoryId) {
    conditions.push(eq(menuEntry.categoryId, opts.categoryId));
  }
  if (opts.externalSource) {
    conditions.push(eq(menuEntry.externalSource, opts.externalSource));
  }
  if (opts.updatedSince) {
    conditions.push(gte(menuEntry.updatedAt, opts.updatedSince));
  }

  if (opts.cursor) {
    const decoded = decodeCursor(opts.cursor);
    if (decoded) {
      conditions.push(lt(menuEntry.createdAt, new Date(decoded.createdAt)));
    }
  }

  const rows = await database
    .select()
    .from(menuEntry)
    .where(and(...conditions))
    .orderBy(desc(menuEntry.createdAt), desc(menuEntry.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;

  return { items: page, nextCursor };
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────

export type CreateMenuEntryOutcome =
  | { ok: true; row: MenuEntryRow }
  | { ok: false; code: "external_id_conflict" }
  | {
      ok: false;
      code: "invalid_payload";
      message: string;
    };

/**
 * Create a menu entry.
 *
 * Validation rules enforced here (layered on top of zod):
 * - `kind: "entry"` → `catalogItemId` must be non-null.
 * - `kind: "group"` → `title` must be non-empty, `catalogItemId` MUST be null.
 */
export async function createMenuEntry(
  menuId: string,
  input: CreateMenuEntryInput,
  source: string = PARTNER_SOURCE
): Promise<CreateMenuEntryOutcome> {
  if (input.kind === "entry" && !input.catalogItemId) {
    return {
      ok: false,
      code: "invalid_payload",
      message: "Entries of kind='entry' require a catalog_item_id.",
    };
  }
  if (input.kind === "group") {
    if (!input.title || input.title.trim().length === 0) {
      return {
        ok: false,
        code: "invalid_payload",
        message: "Entries of kind='group' require a title.",
      };
    }
    if (input.catalogItemId) {
      return {
        ok: false,
        code: "invalid_payload",
        message: "Entries of kind='group' cannot reference a catalog_item.",
      };
    }
  }

  if (input.externalId) {
    const existing = await getMenuEntryByExternalId(
      menuId,
      input.externalId,
      source
    );
    if (existing) {
      return { ok: false, code: "external_id_conflict" };
    }
  }

  const [row] = await database
    .insert(menuEntry)
    .values({
      menuId,
      categoryId: input.categoryId,
      kind: input.kind,
      title: input.title ?? null,
      catalogItemId: input.catalogItemId,
      sortOrder: input.sortOrder ?? 0,
      isVisible: input.isVisible ?? true,
      priceCentsOverride: input.priceCentsOverride ?? null,
      priceLabelOverride: input.priceLabelOverride ?? null,
      externalId: input.externalId ?? null,
      externalSource: input.externalId ? source : null,
    })
    .returning();

  return { ok: true, row };
}

// ──────────────────────────────────────────────────────────────
// Update
// ──────────────────────────────────────────────────────────────

export async function updateMenuEntryRow(
  existing: MenuEntryRow,
  input: UpdateMenuEntryInput
): Promise<MenuEntryRow> {
  const updates: Partial<typeof menuEntry.$inferInsert> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }
  if (input.isVisible !== undefined) {
    updates.isVisible = input.isVisible;
  }
  if (input.priceCentsOverride !== undefined) {
    updates.priceCentsOverride = input.priceCentsOverride;
  }
  if (input.priceLabelOverride !== undefined) {
    updates.priceLabelOverride = input.priceLabelOverride;
  }
  if (input.categoryId !== undefined) {
    updates.categoryId = input.categoryId;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(menuEntry)
    .set(updates)
    .where(eq(menuEntry.id, existing.id))
    .returning();
  return updated;
}

// ──────────────────────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────────────────────

export async function deleteMenuEntryById(
  menuId: string,
  id: string
): Promise<boolean> {
  const deleted = await database
    .delete(menuEntry)
    .where(and(eq(menuEntry.menuId, menuId), eq(menuEntry.id, id)))
    .returning({ id: menuEntry.id });
  return deleted.length > 0;
}
