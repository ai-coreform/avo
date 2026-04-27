import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

export async function resolveVenueMenu(c: Context, venueSlug: string) {
  const [row] = await database
    .select({
      menuSlug: menu.slug,
      venueSlug: venue.slug,
    })
    .from(venue)
    .innerJoin(menu, eq(venue.activeMenuId, menu.id))
    .where(eq(venue.slug, venueSlug))
    .limit(1);

  if (!row) {
    return c.json({ error: "No active menu for this venue" }, 404);
  }

  return c.json({
    data: {
      venueSlug: row.venueSlug,
      menuSlug: row.menuSlug,
    },
  });
}
