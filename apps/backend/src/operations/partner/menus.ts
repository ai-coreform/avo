import { and, desc, eq, gte, lt } from "drizzle-orm";
import database from "@/db";
import { menu } from "@/db/schema/menu";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
} from "./shared/pagination";
import { uniqueSlug } from "./shared/slug";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type MenuRow = typeof menu.$inferSelect;

export type MenuStatus = "draft" | "published" | "archived";

/** Input fields accepted on create. */
export interface CreateMenuInput {
  externalId?: string;
  name: string;
  status?: MenuStatus;
  sortOrder?: number;
}

/** Input fields accepted on PATCH. All optional, excluding external_id re-key. */
export type UpdateMenuInput = Partial<Omit<CreateMenuInput, "externalId">>;

export interface ListMenusOptions {
  limit?: number;
  cursor?: string;
  status?: MenuStatus;
  externalSource?: string;
  updatedSince?: Date;
}

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function getMenuById(
  venueId: string,
  id: string
): Promise<MenuRow | null> {
  const [row] = await database
    .select()
    .from(menu)
    .where(and(eq(menu.venueId, venueId), eq(menu.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getMenuByExternalId(
  venueId: string,
  externalId: string,
  externalSource = PARTNER_SOURCE
): Promise<MenuRow | null> {
  const [row] = await database
    .select()
    .from(menu)
    .where(
      and(
        eq(menu.venueId, venueId),
        eq(menu.externalSource, externalSource),
        eq(menu.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listMenus(
  venueId: string,
  opts: ListMenusOptions = {}
): Promise<{ items: MenuRow[]; nextCursor: string | null }> {
  const limit = normalizeLimit(opts.limit);
  const conditions = [eq(menu.venueId, venueId)];

  if (opts.status) {
    conditions.push(eq(menu.status, opts.status));
  }
  if (opts.externalSource) {
    conditions.push(eq(menu.externalSource, opts.externalSource));
  }
  if (opts.updatedSince) {
    conditions.push(gte(menu.updatedAt, opts.updatedSince));
  }

  if (opts.cursor) {
    const decoded = decodeCursor(opts.cursor);
    if (decoded) {
      conditions.push(lt(menu.createdAt, new Date(decoded.createdAt)));
    }
  }

  const rows = await database
    .select()
    .from(menu)
    .where(and(...conditions))
    .orderBy(desc(menu.createdAt), desc(menu.id))
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

/**
 * Checks that a menu exists and belongs to the authenticated venue.
 * Returns the row or null. Used by menu-tabs and menu-categories routes
 * to validate the `:menuId` path parameter scope.
 */
export async function assertMenuBelongsToVenue(
  venueId: string,
  menuId: string
): Promise<MenuRow | null> {
  return await getMenuById(venueId, menuId);
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

export async function createMenu(
  venueId: string,
  input: CreateMenuInput,
  source: string = PARTNER_SOURCE
): Promise<
  { ok: true; row: MenuRow } | { ok: false; code: "external_id_conflict" }
> {
  if (input.externalId) {
    const existing = await getMenuByExternalId(
      venueId,
      input.externalId,
      source
    );
    if (existing) {
      return { ok: false, code: "external_id_conflict" };
    }
  }

  const slug = await uniqueSlug(input.name, {
    table: menu,
    slugColumn: menu.slug,
    scope: [{ column: menu.venueId, value: venueId }],
  });

  const status: MenuStatus = input.status ?? "draft";
  const publishedAt = status === "published" ? new Date() : null;

  const [row] = await database
    .insert(menu)
    .values({
      venueId,
      name: input.name,
      slug,
      status,
      sortOrder: input.sortOrder ?? 0,
      publishedAt,
      externalId: input.externalId ?? null,
      externalSource: input.externalId ? source : null,
    })
    .returning();

  return { ok: true, row };
}

export async function updateMenuRow(
  existing: MenuRow,
  input: UpdateMenuInput
): Promise<MenuRow> {
  const updates: Partial<typeof menu.$inferInsert> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
    // Transition to published → stamp publishedAt if not previously set.
    if (input.status === "published" && !existing.publishedAt) {
      updates.publishedAt = new Date();
    }
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(menu)
    .set(updates)
    .where(eq(menu.id, existing.id))
    .returning();

  return updated;
}

export async function deleteMenuById(
  venueId: string,
  id: string
): Promise<boolean> {
  const result = await database
    .delete(menu)
    .where(and(eq(menu.venueId, venueId), eq(menu.id, id)))
    .returning({ id: menu.id });
  return result.length > 0;
}
