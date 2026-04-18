import { and, eq } from "drizzle-orm";
import database from "@/db";
import { menuCategory } from "@/db/schema/menu-category";
import { menuTab } from "@/db/schema/menu-tab";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import { uniqueSlug } from "./shared/slug";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type MenuCategoryRow = typeof menuCategory.$inferSelect;

/** Input fields accepted on create. Exactly one of tabId / tabExternalId
 * must resolve to a tab belonging to the parent menu — enforced at the
 * route layer before calling createMenuCategory. */
export interface CreateMenuCategoryInput {
  externalId?: string;
  title: string;
  isVisible?: boolean;
  sortOrder?: number;
  tabId: string; // resolved by route layer
}

/** Input fields accepted on PATCH. */
export interface UpdateMenuCategoryInput {
  title?: string;
  isVisible?: boolean;
  sortOrder?: number;
  /** New tabId to move the category to (already resolved + validated
   * to belong to the same menu at the route layer). */
  tabId?: string;
}

export interface ListMenuCategoriesOptions {
  tabId?: string;
}

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function getMenuCategoryById(
  menuId: string,
  id: string
): Promise<MenuCategoryRow | null> {
  const [row] = await database
    .select()
    .from(menuCategory)
    .where(and(eq(menuCategory.menuId, menuId), eq(menuCategory.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMenuCategoryByExternalId(
  menuId: string,
  externalId: string,
  externalSource = PARTNER_SOURCE
): Promise<MenuCategoryRow | null> {
  const [row] = await database
    .select()
    .from(menuCategory)
    .where(
      and(
        eq(menuCategory.menuId, menuId),
        eq(menuCategory.externalSource, externalSource),
        eq(menuCategory.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listMenuCategories(
  menuId: string,
  opts: ListMenuCategoriesOptions = {}
): Promise<MenuCategoryRow[]> {
  const conditions = [eq(menuCategory.menuId, menuId)];
  if (opts.tabId) {
    conditions.push(eq(menuCategory.tabId, opts.tabId));
  }
  return await database
    .select()
    .from(menuCategory)
    .where(and(...conditions));
}

/**
 * Resolve a tab by either its Avo UUID or its external_id, ensuring it
 * belongs to the given menu. Returns null if either lookup fails or the
 * tab is attached to a different menu.
 */
export async function resolveTabForMenu(
  menuId: string,
  opts: { tabId?: string; tabExternalId?: string },
  externalSource: string = PARTNER_SOURCE
): Promise<typeof menuTab.$inferSelect | null> {
  if (opts.tabId) {
    const [row] = await database
      .select()
      .from(menuTab)
      .where(and(eq(menuTab.id, opts.tabId), eq(menuTab.menuId, menuId)))
      .limit(1);
    return row ?? null;
  }
  if (opts.tabExternalId) {
    const [row] = await database
      .select()
      .from(menuTab)
      .where(
        and(
          eq(menuTab.menuId, menuId),
          eq(menuTab.externalSource, externalSource),
          eq(menuTab.externalId, opts.tabExternalId)
        )
      )
      .limit(1);
    return row ?? null;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

export async function createMenuCategory(
  menuId: string,
  input: CreateMenuCategoryInput,
  source: string = PARTNER_SOURCE
): Promise<
  | { ok: true; row: MenuCategoryRow }
  | { ok: false; code: "external_id_conflict" }
> {
  if (input.externalId) {
    const existing = await getMenuCategoryByExternalId(
      menuId,
      input.externalId,
      source
    );
    if (existing) {
      return { ok: false, code: "external_id_conflict" };
    }
  }

  const slug = await uniqueSlug(input.title, {
    table: menuCategory,
    slugColumn: menuCategory.slug,
    scope: [{ column: menuCategory.menuId, value: menuId }],
  });

  const [row] = await database
    .insert(menuCategory)
    .values({
      menuId,
      tabId: input.tabId,
      title: input.title,
      slug,
      isVisible: input.isVisible ?? true,
      sortOrder: input.sortOrder ?? 0,
      externalId: input.externalId ?? null,
      externalSource: input.externalId ? source : null,
    })
    .returning();

  return { ok: true, row };
}

export async function updateMenuCategoryRow(
  existing: MenuCategoryRow,
  input: UpdateMenuCategoryInput
): Promise<MenuCategoryRow> {
  const updates: Partial<typeof menuCategory.$inferInsert> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.isVisible !== undefined) {
    updates.isVisible = input.isVisible;
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }
  if (input.tabId !== undefined) {
    updates.tabId = input.tabId;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(menuCategory)
    .set(updates)
    .where(eq(menuCategory.id, existing.id))
    .returning();

  return updated;
}

export async function deleteMenuCategoryById(
  menuId: string,
  id: string
): Promise<boolean> {
  const result = await database
    .delete(menuCategory)
    .where(and(eq(menuCategory.menuId, menuId), eq(menuCategory.id, id)))
    .returning({ id: menuCategory.id });
  return result.length > 0;
}
