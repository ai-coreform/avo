import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

export async function resolveMenu(c: Context, menuId: string) {
  const [row] = await database
    .select({
      menuSlug: menu.slug,
      venueSlug: venue.slug,
    })
    .from(menu)
    .innerJoin(venue, eq(menu.venueId, venue.id))
    .where(eq(menu.id, menuId))
    .limit(1);

  if (!row) {
    return c.json({ error: "Menu not found" }, 404);
  }

  return c.json({
    data: {
      venueSlug: row.venueSlug,
      menuSlug: row.menuSlug,
    },
  });
}
