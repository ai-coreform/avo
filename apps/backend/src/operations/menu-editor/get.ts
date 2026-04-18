import { and, asc, countDistinct, eq, gt, inArray } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { contentTranslation } from "@/db/schema/content-translation";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { getMenu } from "@/operations/menu/get";
import { getVenueSecondaryLocaleCodes } from "@/routes/manage/locales/locales.service";
import {
  type MenuEditorCategory,
  type MenuEditorData,
  type MenuEditorEntryRow,
  type MenuEditorGroupRow,
  serializeMenuEditorMenu,
} from "./shared";
import {
  buildMenuEditorTranslationsMap,
  getMenuEditorTranslations,
  type MenuTranslationEntityType,
} from "./translations";

interface GetMenuEditorInput {
  venueId: string;
  menuId: string;
}

export async function getMenuEditor({
  venueId,
  menuId,
}: GetMenuEditorInput): Promise<MenuEditorData> {
  const selectedMenu = await getMenu({ venueId, menuId });

  const tabRows = await database
    .select()
    .from(menuTab)
    .where(eq(menuTab.menuId, menuId))
    .orderBy(asc(menuTab.sortOrder), asc(menuTab.createdAt));

  const categoryRows = await database
    .select()
    .from(menuCategory)
    .where(eq(menuCategory.menuId, menuId))
    .orderBy(asc(menuCategory.sortOrder), asc(menuCategory.createdAt));

  const categoryIds = categoryRows.map((category) => category.id);
  const tabIds = tabRows.map((tab) => tab.id);

  const entryRows =
    categoryIds.length > 0
      ? await database
          .select({
            id: menuEntry.id,
            categoryId: menuEntry.categoryId,
            kind: menuEntry.kind,
            rowTitle: menuEntry.title,
            sortOrder: menuEntry.sortOrder,
            isVisible: menuEntry.isVisible,
            priceCentsOverride: menuEntry.priceCentsOverride,
            priceLabelOverride: menuEntry.priceLabelOverride,
            catalogItemId: catalogItem.id,
            title: catalogItem.title,
            description: catalogItem.description,
            priceCents: catalogItem.priceCents,
            priceLabel: catalogItem.priceLabel,
            allergens: catalogItem.allergens,
            features: catalogItem.features,
            additives: catalogItem.additives,
            imageUrl: catalogItem.imageUrl,
          })
          .from(menuEntry)
          .leftJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
          .where(eq(menuEntry.menuId, menuId))
          .orderBy(asc(menuEntry.sortOrder), asc(menuEntry.createdAt))
      : [];

  // Determine which catalog items are shared across multiple menus
  const catalogItemIds = [
    ...new Set(
      entryRows
        .map((e) => e.catalogItemId)
        .filter((id): id is string => id !== null)
    ),
  ];
  const sharedCatalogItemIds = new Set<string>();
  if (catalogItemIds.length > 0) {
    const sharedRows = await database
      .select({
        catalogItemId: menuEntry.catalogItemId,
      })
      .from(menuEntry)
      .where(inArray(menuEntry.catalogItemId, catalogItemIds))
      .groupBy(menuEntry.catalogItemId)
      .having(gt(countDistinct(menuEntry.menuId), 1));
    for (const row of sharedRows) {
      if (row.catalogItemId) {
        sharedCatalogItemIds.add(row.catalogItemId);
      }
    }
  }

  const entryIds = entryRows.map((entry) => entry.id);
  const secondaryLocales = await getVenueSecondaryLocaleCodes(venueId);
  const translationEntityIds = [...tabIds, ...categoryIds, ...entryIds];
  const translationRows =
    translationEntityIds.length > 0 && secondaryLocales.length > 0
      ? await database
          .select({
            entityType: contentTranslation.entityType,
            entityId: contentTranslation.entityId,
            locale: contentTranslation.locale,
            fieldsJson: contentTranslation.fieldsJson,
          })
          .from(contentTranslation)
          .where(
            and(
              eq(contentTranslation.venueId, venueId),
              inArray(contentTranslation.entityType, [
                "menu_tab",
                "menu_category",
                "menu_entry",
              ]),
              inArray(contentTranslation.entityId, translationEntityIds),
              inArray(contentTranslation.locale, secondaryLocales)
            )
          )
      : [];
  const translationsMap = buildMenuEditorTranslationsMap(
    translationRows.map((row) => ({
      ...row,
      entityType: row.entityType as MenuTranslationEntityType,
    }))
  );

  const categoriesByTabId = new Map<string, typeof categoryRows>();
  for (const category of categoryRows) {
    const existing = categoriesByTabId.get(category.tabId);
    if (existing) {
      existing.push(category);
      continue;
    }
    categoriesByTabId.set(category.tabId, [category]);
  }

  const entryRowsByCategoryId = new Map<string, typeof entryRows>();
  for (const entry of entryRows) {
    const existing = entryRowsByCategoryId.get(entry.categoryId);
    if (existing) {
      existing.push(entry);
      continue;
    }
    entryRowsByCategoryId.set(entry.categoryId, [entry]);
  }

  const tabs = tabRows.map((tab) => {
    const categories = categoriesByTabId.get(tab.id) ?? [];

    return {
      id: tab.id,
      label: tab.label,
      slug: tab.slug,
      isVisible: tab.isVisible,
      translations: getMenuEditorTranslations(
        translationsMap,
        "menu_tab",
        tab.id
      ),
      categories: categories.map<MenuEditorCategory>((category) => {
        const categoryEntries = entryRowsByCategoryId.get(category.id) ?? [];
        const rows: Array<MenuEditorGroupRow | MenuEditorEntryRow> =
          categoryEntries.map((entry) =>
            entry.kind === "group"
              ? {
                  kind: "group",
                  id: entry.id,
                  title: entry.rowTitle?.trim() || "Nuovo gruppo",
                  isVisible: entry.isVisible,
                  translations: getMenuEditorTranslations(
                    translationsMap,
                    "menu_entry",
                    entry.id
                  ),
                }
              : {
                  kind: "entry",
                  id: entry.id,
                  catalogItemId: entry.catalogItemId,
                  isShared: entry.catalogItemId
                    ? sharedCatalogItemIds.has(entry.catalogItemId)
                    : false,
                  title: entry.title?.trim() || "Nuova voce",
                  description: entry.description,
                  priceCents: entry.priceCents,
                  priceLabel: entry.priceLabel,
                  allergens: entry.allergens ?? [],
                  features: entry.features ?? [],
                  additives: entry.additives ?? [],
                  imageUrl: entry.imageUrl ?? null,
                  isVisible: entry.isVisible,
                  priceCentsOverride: entry.priceCentsOverride,
                  priceLabelOverride: entry.priceLabelOverride,
                  translations: getMenuEditorTranslations(
                    translationsMap,
                    "menu_entry",
                    entry.id
                  ),
                }
          );

        return {
          id: category.id,
          title: category.title,
          isVisible: category.isVisible,
          translations: getMenuEditorTranslations(
            translationsMap,
            "menu_category",
            category.id
          ),
          rows,
        };
      }),
    };
  });

  return {
    menu: serializeMenuEditorMenu(selectedMenu),
    tabs,
    locales: secondaryLocales,
  };
}
