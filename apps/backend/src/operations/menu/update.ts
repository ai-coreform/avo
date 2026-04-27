import { and, eq } from "drizzle-orm";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";
import type { MenuThemeData } from "@/types/menu-theme";
import { getMenu } from "./get";
import { getUniqueMenuSlug } from "./shared";

interface UpdateMenuInput {
  venueId: string;
  menuId: string;
  name?: string;
  status?: (typeof menu.$inferSelect)["status"];
  sortOrder?: number;
  theme?: MenuThemeData;
}

export async function updateMenu({
  venueId,
  menuId,
  name,
  status,
  sortOrder,
  theme,
}: UpdateMenuInput) {
  const existingMenu = await getMenu({ venueId, menuId });
  const values: Partial<typeof menu.$inferInsert> = {};

  if (name !== undefined) {
    values.name = name;
    values.slug = await getUniqueMenuSlug(venueId, name, menuId);
  }

  if (status !== undefined) {
    values.status = status;

    if (status === "published" && !existingMenu.publishedAt) {
      values.publishedAt = new Date();
    }
  }

  if (sortOrder !== undefined) {
    values.sortOrder = sortOrder;
  }

  if (theme !== undefined) {
    // Merge with existing theme so partial updates work
    values.theme = { ...existingMenu.theme, ...theme };
  }

  const [updatedMenu] = await database
    .update(menu)
    .set(values)
    .where(and(eq(menu.id, menuId), eq(menu.venueId, venueId)))
    .returning();

  // If this menu was archived and it was the active menu, clear the reference
  if (status === "archived" || status === "draft") {
    await database
      .update(venue)
      .set({ activeMenuId: null })
      .where(and(eq(venue.id, venueId), eq(venue.activeMenuId, menuId)));
  }

  return updatedMenu;
}
