import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { menu } from "@/db/schema/menu";

interface GetMenuInput {
  venueId: string;
  menuId?: string;
  menuSlug?: string;
}

export async function getMenu({ venueId, menuId, menuSlug }: GetMenuInput) {
  const conditions = [eq(menu.venueId, venueId)];

  if (menuId) {
    conditions.push(eq(menu.id, menuId));
  } else if (menuSlug) {
    conditions.push(eq(menu.slug, menuSlug));
  } else {
    throw new HTTPException(400, {
      message: "Either menuId or menuSlug is required",
    });
  }

  const [existingMenu] = await database
    .select()
    .from(menu)
    .where(and(...conditions))
    .limit(1);

  if (!existingMenu) {
    throw new HTTPException(404, {
      message: "Menu not found",
    });
  }

  return existingMenu;
}
