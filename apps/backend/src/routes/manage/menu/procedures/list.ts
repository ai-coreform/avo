import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { listMenus } from "@/operations/menu/list";
import { serializeMenu } from "@/operations/menu/shared";

export async function list(c: Context) {
  const member = c.get("member");
  const menus = await listMenus({ venueId: member.venueId });

  const [venueRow] = await database
    .select({ slug: venue.slug })
    .from(venue)
    .where(eq(venue.id, member.venueId))
    .limit(1);

  return c.json({
    data: menus.map(serializeMenu),
    venueSlug: venueRow?.slug ?? null,
  });
}
