import { and, eq, like, sql } from "drizzle-orm";
import database from "@/db";
import { menu } from "@/db/schema/menu";
import { slugify } from "@/utils/slugify";

export type MenuRecord = typeof menu.$inferSelect;

export async function getNextMenuSortOrder(venueId: string) {
  const [result] = await database
    .select({
      maxSortOrder: sql<number>`coalesce(max(${menu.sortOrder}), -1)`,
    })
    .from(menu)
    .where(eq(menu.venueId, venueId));

  return Number(result?.maxSortOrder ?? -1) + 1;
}

export async function getUniqueMenuSlug(
  venueId: string,
  name: string,
  excludeMenuId?: string
): Promise<string> {
  const baseSlug = slugify(name) || "menu";

  const existingSlugs = await database
    .select({ slug: menu.slug })
    .from(menu)
    .where(
      excludeMenuId
        ? and(
            eq(menu.venueId, venueId),
            like(menu.slug, `${baseSlug}%`),
            sql`${menu.id} != ${excludeMenuId}`
          )
        : and(eq(menu.venueId, venueId), like(menu.slug, `${baseSlug}%`))
    );

  const slugSet = new Set(existingSlugs.map((r) => r.slug));

  if (!slugSet.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (slugSet.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}

export function serializeMenu(record: MenuRecord) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    publishedAt: record.publishedAt?.toISOString() ?? null,
  };
}
