import { and, asc, eq } from "drizzle-orm";
import database from "@/db";
import { menuTab } from "@/db/schema/menu-tab";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import { uniqueSlug } from "./shared/slug";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type MenuTabRow = typeof menuTab.$inferSelect;

/** Input fields accepted on create. */
export interface CreateMenuTabInput {
  externalId?: string;
  label: string;
  isVisible?: boolean;
  sortOrder?: number;
}

/** Input fields accepted on PATCH. All optional, no external_id re-key. */
export type UpdateMenuTabInput = Partial<
  Omit<CreateMenuTabInput, "externalId">
>;

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function getMenuTabById(
  menuId: string,
  id: string
): Promise<MenuTabRow | null> {
  const [row] = await database
    .select()
    .from(menuTab)
    .where(and(eq(menuTab.menuId, menuId), eq(menuTab.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMenuTabByExternalId(
  menuId: string,
  externalId: string,
  externalSource = PARTNER_SOURCE
): Promise<MenuTabRow | null> {
  const [row] = await database
    .select()
    .from(menuTab)
    .where(
      and(
        eq(menuTab.menuId, menuId),
        eq(menuTab.externalSource, externalSource),
        eq(menuTab.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * List all tabs belonging to a menu, ordered by `sort_order` then `created_at`.
 * Per the partner docs this is always fully returned (not paginated): a menu
 * typically has a small, bounded number of tabs.
 */
export async function listMenuTabs(menuId: string): Promise<MenuTabRow[]> {
  return await database
    .select()
    .from(menuTab)
    .where(eq(menuTab.menuId, menuId))
    .orderBy(asc(menuTab.sortOrder), asc(menuTab.createdAt));
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

export async function createMenuTab(
  menuId: string,
  input: CreateMenuTabInput,
  source: string = PARTNER_SOURCE
): Promise<
  { ok: true; row: MenuTabRow } | { ok: false; code: "external_id_conflict" }
> {
  if (input.externalId) {
    const existing = await getMenuTabByExternalId(
      menuId,
      input.externalId,
      source
    );
    if (existing) {
      return { ok: false, code: "external_id_conflict" };
    }
  }

  const slug = await uniqueSlug(input.label, {
    table: menuTab,
    slugColumn: menuTab.slug,
    scope: [{ column: menuTab.menuId, value: menuId }],
  });

  const [row] = await database
    .insert(menuTab)
    .values({
      menuId,
      label: input.label,
      slug,
      isVisible: input.isVisible ?? true,
      sortOrder: input.sortOrder ?? 0,
      externalId: input.externalId ?? null,
      externalSource: input.externalId ? source : null,
    })
    .returning();

  return { ok: true, row };
}

export async function updateMenuTabRow(
  existing: MenuTabRow,
  input: UpdateMenuTabInput
): Promise<MenuTabRow> {
  const updates: Partial<typeof menuTab.$inferInsert> = {};

  if (input.label !== undefined) {
    updates.label = input.label;
  }
  if (input.isVisible !== undefined) {
    updates.isVisible = input.isVisible;
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(menuTab)
    .set(updates)
    .where(eq(menuTab.id, existing.id))
    .returning();

  return updated;
}

export async function deleteMenuTabById(
  menuId: string,
  id: string
): Promise<boolean> {
  const result = await database
    .delete(menuTab)
    .where(and(eq(menuTab.menuId, menuId), eq(menuTab.id, id)))
    .returning({ id: menuTab.id });
  return result.length > 0;
}
