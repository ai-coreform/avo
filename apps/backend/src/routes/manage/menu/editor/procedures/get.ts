import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { getMenu } from "@/operations/menu/get";
import { getMenuEditor } from "@/operations/menu-editor/get";
import type { MenuParams } from "../../menu.schemas";

export async function get(c: Context, params: MenuParams) {
  const member = c.get("member");

  const existing = await getMenu({
    venueId: member.venueId,
    menuSlug: params.menuSlug,
  });

  const [editor, [venueRow]] = await Promise.all([
    getMenuEditor({
      venueId: member.venueId,
      menuId: existing.id,
    }),
    database
      .select({ slug: venue.slug, name: venue.name, logo: venue.logo })
      .from(venue)
      .where(eq(venue.id, member.venueId))
      .limit(1),
  ]);

  return c.json({
    data: editor,
    venueSlug: venueRow?.slug ?? null,
    venueName: venueRow?.name ?? null,
    venueLogo: venueRow?.logo ?? null,
  });
}
