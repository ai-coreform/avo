import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { contentTranslation } from "@/db/schema/content-translation";
import { menu } from "@/db/schema/menu";

export async function getTranslations(
  venueSlug: string,
  menuSlug: string,
  locale: string
) {
  const [venueRow] = await database
    .select({ id: venue.id })
    .from(venue)
    .where(eq(venue.slug, venueSlug))
    .limit(1);

  if (!venueRow) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  const [publishedMenu] = await database
    .select({ id: menu.id })
    .from(menu)
    .where(
      and(
        eq(menu.venueId, venueRow.id),
        eq(menu.slug, menuSlug),
        eq(menu.status, "published")
      )
    )
    .limit(1);

  if (!publishedMenu) {
    throw new HTTPException(404, { message: "Menu not found" });
  }

  const translationRows = await database
    .select({
      entityType: contentTranslation.entityType,
      entityId: contentTranslation.entityId,
      fieldsJson: contentTranslation.fieldsJson,
    })
    .from(contentTranslation)
    .where(
      and(
        eq(contentTranslation.venueId, venueRow.id),
        eq(contentTranslation.locale, locale),
        inArray(contentTranslation.entityType, [
          "menu_tab",
          "menu_category",
          "menu_entry",
          "catalog_item",
          "promotion",
          "promotion_component",
        ])
      )
    );

  // Build a map: entityId -> fieldsJson
  const translations: Record<string, Record<string, string | null>> = {};
  for (const row of translationRows) {
    translations[row.entityId] = row.fieldsJson;
  }

  return { locale, translations };
}
