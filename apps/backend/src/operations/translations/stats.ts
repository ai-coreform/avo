import { and, count, eq, inArray } from "drizzle-orm";
import database from "@/db";
import { contentTranslation } from "@/db/schema/content-translation";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { getVenueSecondaryLocaleCodes } from "@/routes/manage/locales/locales.service";

interface LocaleStats {
  translated: number;
  total: number;
}

interface TranslationStats {
  total: number;
  perLocale: Record<string, LocaleStats>;
}

async function getVenueMenuIds(venueId: string): Promise<string[]> {
  const rows = await database
    .select({ id: menu.id })
    .from(menu)
    .where(eq(menu.venueId, venueId));
  return rows.map((r) => r.id);
}

/**
 * Counts total translatable entities and how many have translations per locale.
 */
export async function getTranslationStats(
  venueId: string
): Promise<TranslationStats> {
  const secondaryLocales = await getVenueSecondaryLocaleCodes(venueId);

  if (secondaryLocales.length === 0) {
    return { total: 0, perLocale: {} };
  }

  const menuIds = await getVenueMenuIds(venueId);

  if (menuIds.length === 0) {
    const perLocale: Record<string, LocaleStats> = {};
    for (const locale of secondaryLocales) {
      perLocale[locale] = { translated: 0, total: 0 };
    }
    return { total: 0, perLocale };
  }

  // Count total translatable entities across all menus
  const [tabCount] = await database
    .select({ count: count() })
    .from(menuTab)
    .where(inArray(menuTab.menuId, menuIds));

  const [categoryCount] = await database
    .select({ count: count() })
    .from(menuCategory)
    .where(inArray(menuCategory.menuId, menuIds));

  const [entryCount] = await database
    .select({ count: count() })
    .from(menuEntry)
    .where(inArray(menuEntry.menuId, menuIds));

  const total =
    (tabCount?.count ?? 0) +
    (categoryCount?.count ?? 0) +
    (entryCount?.count ?? 0);

  if (total === 0) {
    const perLocale: Record<string, LocaleStats> = {};
    for (const locale of secondaryLocales) {
      perLocale[locale] = { translated: 0, total: 0 };
    }
    return { total: 0, perLocale };
  }

  // Count translations per locale
  const translationCounts = await database
    .select({
      locale: contentTranslation.locale,
      count: count(),
    })
    .from(contentTranslation)
    .where(
      and(
        eq(contentTranslation.venueId, venueId),
        inArray(contentTranslation.locale, secondaryLocales),
        inArray(contentTranslation.entityType, [
          "menu_tab",
          "menu_category",
          "menu_entry",
        ])
      )
    )
    .groupBy(contentTranslation.locale);

  const translationMap = new Map(
    translationCounts.map((row) => [row.locale, row.count])
  );

  const perLocale: Record<string, LocaleStats> = {};
  for (const locale of secondaryLocales) {
    perLocale[locale] = {
      translated: translationMap.get(locale) ?? 0,
      total,
    };
  }

  return { total, perLocale };
}
