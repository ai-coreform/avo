import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { menu } from "@/db/schema/menu";

interface DeleteMenuInput {
  venueId: string;
  menuId: string;
}

export async function deleteMenu({ venueId, menuId }: DeleteMenuInput) {
  const [deletedMenu] = await database
    .delete(menu)
    .where(and(eq(menu.id, menuId), eq(menu.venueId, venueId)))
    .returning({ id: menu.id });

  if (!deletedMenu) {
    throw new HTTPException(404, {
      message: "Menu not found",
    });
  }

  return deletedMenu;
}
