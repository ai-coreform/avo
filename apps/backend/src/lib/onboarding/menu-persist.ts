import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import type {
  ExtractedMenuPayload,
  ImportedMenuItem,
  MenuImportSummary,
} from "./types";
import { uniqueSlug } from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tx = Parameters<Parameters<typeof database.transaction>[0]>[0];

function buildCatalogItemValues(
  venueId: string,
  item: ImportedMenuItem,
  usedSlugs: Set<string>
) {
  // ImportedMenuItem.price is extracted from menus (euros). DB stores cents.
  const priceCents = item.price != null ? Math.round(item.price * 100) : null;

  return {
    venueId,
    slug: uniqueSlug(item.title, usedSlugs),
    title: item.title,
    description: item.description ?? null,
    priceCents,
    priceLabel: item.priceLabel ?? null,
    allergens: item.allergens ?? [],
    features: item.features ?? [],
    additives: item.additives ?? [],
  };
}

async function insertItemEntry(
  tx: Tx,
  venueId: string,
  menuId: string,
  categoryId: string,
  item: ImportedMenuItem,
  sortOrder: number,
  usedItemSlugs: Set<string>
) {
  const catalogValues = buildCatalogItemValues(venueId, item, usedItemSlugs);

  const [insertedCatalogItem] = await tx
    .insert(catalogItem)
    .values(catalogValues)
    .returning({ id: catalogItem.id });

  await tx.insert(menuEntry).values({
    menuId,
    categoryId,
    kind: "entry",
    catalogItemId: insertedCatalogItem.id,
    sortOrder,
  });
}

async function insertGroupEntries(
  tx: Tx,
  venueId: string,
  menuId: string,
  categoryId: string,
  groups: ExtractedMenuPayload["categories"][number]["groups"],
  startSortOrder: number,
  usedItemSlugs: Set<string>
): Promise<{ entrySortOrder: number; groupCount: number; itemCount: number }> {
  let entrySortOrder = startSortOrder;
  let groupCount = 0;
  let itemCount = 0;

  for (const group of groups ?? []) {
    await tx.insert(menuEntry).values({
      menuId,
      categoryId,
      kind: "group",
      title: group.title,
      sortOrder: entrySortOrder,
    });

    entrySortOrder++;
    groupCount++;

    for (const item of group.items) {
      await insertItemEntry(
        tx,
        venueId,
        menuId,
        categoryId,
        item,
        entrySortOrder,
        usedItemSlugs
      );
      entrySortOrder++;
      itemCount++;
    }
  }

  return { entrySortOrder, groupCount, itemCount };
}

// ---------------------------------------------------------------------------
// Main persistence function
// ---------------------------------------------------------------------------

/**
 * Persists an AI-extracted menu into the new normalized schema:
 *   menuTab → menuCategory → catalogItem + menuEntry
 *
 * Groups become `menuEntry(kind: 'group')` title-only headers,
 * followed by their items as `menuEntry(kind: 'entry')` rows.
 */
export async function persistImportedMenu(
  venueId: string,
  menuId: string,
  payload: ExtractedMenuPayload
): Promise<MenuImportSummary> {
  const usedCategorySlugs = new Set<string>();
  const usedItemSlugs = new Set<string>();

  let categoryCount = 0;
  let groupCount = 0;
  let itemCount = 0;

  await database.transaction(async (tx) => {
    // 1. Determine which tabs are needed (food / drink)
    const sectionsUsed = new Set(payload.categories.map((c) => c.section));

    const tabMap = new Map<string, string>();
    let tabOrder = 0;

    for (const section of ["food", "drink"] as const) {
      if (!sectionsUsed.has(section)) {
        continue;
      }

      const label = section === "food" ? "Cibo" : "Bevande";
      const slug = section === "food" ? "cibo" : "bevande";

      const [inserted] = await tx
        .insert(menuTab)
        .values({ menuId, label, slug, sortOrder: tabOrder })
        .returning({ id: menuTab.id });

      tabMap.set(section, inserted.id);
      tabOrder++;
    }

    // 2. Create categories and their entries
    for (const category of payload.categories) {
      const tabId = tabMap.get(category.section);
      if (!tabId) {
        continue;
      }

      const categorySlug = uniqueSlug(category.title, usedCategorySlugs);

      const [insertedCategory] = await tx
        .insert(menuCategory)
        .values({
          menuId,
          tabId,
          slug: categorySlug,
          title: category.title,
          sortOrder: categoryCount,
        })
        .returning({ id: menuCategory.id });

      const categoryId = insertedCategory.id;
      categoryCount++;

      // Flat sort order counter for all entries within a category
      let entrySortOrder = 0;

      // 2a. Direct items (no group)
      for (const item of category.items ?? []) {
        await insertItemEntry(
          tx,
          venueId,
          menuId,
          categoryId,
          item,
          entrySortOrder,
          usedItemSlugs
        );
        entrySortOrder++;
        itemCount++;
      }

      // 2b. Groups — each group becomes a title-only header entry + its items
      const groupResult = await insertGroupEntries(
        tx,
        venueId,
        menuId,
        categoryId,
        category.groups,
        entrySortOrder,
        usedItemSlugs
      );
      groupCount += groupResult.groupCount;
      itemCount += groupResult.itemCount;
    }
  });

  return { categoryCount, groupCount, itemCount };
}
