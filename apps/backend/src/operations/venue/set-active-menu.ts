import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

interface SetActiveMenuInput {
  venueId: string;
  menuId: string | null;
}

export async function setActiveMenu({ venueId, menuId }: SetActiveMenuInput) {
  if (menuId) {
    // Verify menu exists, belongs to venue, and is published
    const [target] = await database
      .select({ id: menu.id, status: menu.status })
      .from(menu)
      .where(and(eq(menu.id, menuId), eq(menu.venueId, venueId)))
      .limit(1);

    if (!target) {
      throw new HTTPException(404, { message: "Menu not found" });
    }

    if (target.status !== "published") {
      throw new HTTPException(400, {
        message: "Only published menus can be set as active",
      });
    }
  }

  const [updated] = await database
    .update(venue)
    .set({ activeMenuId: menuId })
    .where(eq(venue.id, venueId))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  return updated;
}
