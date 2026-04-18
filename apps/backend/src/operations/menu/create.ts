import database from "@/db";
import { menu } from "@/db/schema/menu";
import { getNextMenuSortOrder, getUniqueMenuSlug } from "./shared";

interface CreateMenuInput {
  venueId: string;
  name: string;
  status?: (typeof menu.$inferSelect)["status"];
}

export async function createMenu({ venueId, name, status }: CreateMenuInput) {
  const [nextSortOrder, slug] = await Promise.all([
    getNextMenuSortOrder(venueId),
    getUniqueMenuSlug(venueId, name),
  ]);
  const resolvedStatus = status ?? "draft";

  const [createdMenu] = await database
    .insert(menu)
    .values({
      venueId,
      name,
      slug,
      status: resolvedStatus,
      sortOrder: nextSortOrder,
      publishedAt: resolvedStatus === "published" ? new Date() : null,
    })
    .returning();

  return createdMenu;
}
