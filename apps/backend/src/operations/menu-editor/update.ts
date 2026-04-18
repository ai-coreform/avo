import { and, eq, inArray, ne } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { contentTranslation } from "@/db/schema/content-translation";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { getMenu } from "@/operations/menu/get";
import { startTranslationRun } from "@/operations/translations/job";
import { getVenueSecondaryLocaleCodes } from "@/routes/manage/locales/locales.service";
import type { UpdateMenuEditorPayload } from "@/routes/manage/menu/editor.schemas";
import { slugify } from "@/utils/slugify";
import { getMenuEditor } from "./get";
import type { MenuEditorData } from "./shared";
import { createMenuEditorTranslationInserts } from "./translations";

type EditorTx = Parameters<Parameters<typeof database.transaction>[0]>[0];
type TranslationInsert = typeof contentTranslation.$inferInsert;
type EntryRow =
  UpdateMenuEditorPayload["tabs"][number]["categories"][number]["rows"][number];

interface UpdateMenuEditorInput {
  venueId: string;
  menuId: string;
  input: UpdateMenuEditorPayload;
  sharedCatalogStrategy?: "global" | "local";
}

function getUniqueSlug(
  baseValue: string,
  usedSlugs: Set<string>,
  fallback: string
) {
  const baseSlug = slugify(baseValue) || fallback;
  let candidate = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(candidate);

  return candidate;
}

async function deleteOldTranslations(
  tx: EditorTx,
  previousTabIds: string[],
  previousCategoryIds: string[],
  previousEntryIds: string[]
) {
  if (previousTabIds.length > 0) {
    await tx
      .delete(contentTranslation)
      .where(
        and(
          eq(contentTranslation.entityType, "menu_tab"),
          inArray(contentTranslation.entityId, previousTabIds)
        )
      );
  }

  if (previousCategoryIds.length > 0) {
    await tx
      .delete(contentTranslation)
      .where(
        and(
          eq(contentTranslation.entityType, "menu_category"),
          inArray(contentTranslation.entityId, previousCategoryIds)
        )
      );
  }

  if (previousEntryIds.length > 0) {
    await tx
      .delete(contentTranslation)
      .where(
        and(
          eq(contentTranslation.entityType, "menu_entry"),
          inArray(contentTranslation.entityId, previousEntryIds)
        )
      );
  }
}

interface RowProcessingOpts {
  venueId: string;
  menuId: string;
  categoryId: string;
  rowIndex: number;
  existingCatalogItemMap: Map<string, { id: string; slug: string }>;
  usedCatalogItemSlugs: Set<string>;
  nextCatalogItemIds: Set<string>;
  translationRows: TranslationInsert[];
  nextSnapshot: Map<string, string>;
  sharedCatalogStrategy: "global" | "local" | undefined;
}

async function processGroupRow(
  tx: EditorTx,
  row: EntryRow & { kind: "group" },
  opts: RowProcessingOpts
) {
  const [insertedGroup] = await tx
    .insert(menuEntry)
    .values({
      id: row.id ?? undefined,
      menuId: opts.menuId,
      categoryId: opts.categoryId,
      kind: "group",
      title: row.title,
      sortOrder: opts.rowIndex,
      isVisible: row.isVisible,
    })
    .returning();
  opts.translationRows.push(
    ...createMenuEditorTranslationInserts({
      venueId: opts.venueId,
      entityType: "menu_entry",
      entityId: insertedGroup.id,
      translations: row.translations,
    })
  );
  opts.nextSnapshot.set(
    `entry:${insertedGroup.id}`,
    [row.title ?? "", ""].join("\0")
  );
}

async function updateCatalogItemFields(
  tx: EditorTx,
  itemId: string,
  row: EntryRow & { kind: "entry" },
  shared: boolean,
  strategy: "global" | "local" | undefined
) {
  // Global fields — always updated (identity + properties of the item)
  const globalFields = {
    title: row.title,
    description: row.description,
    allergens: row.allergens,
    features: row.features,
    additives: row.additives,
    imageUrl: row.imageUrl ?? null,
  };

  if (shared && strategy !== "global") {
    // Shared + local (or no strategy) — only update global fields
    await tx
      .update(catalogItem)
      .set(globalFields)
      .where(eq(catalogItem.id, itemId));
  } else {
    // Not shared, or shared + global — update everything
    await tx
      .update(catalogItem)
      .set({
        ...globalFields,
        priceCents: row.priceCents,
        priceLabel: row.priceLabel,
      })
      .where(eq(catalogItem.id, itemId));

    // When updating prices globally, clear any per-entry overrides
    // across ALL menus so every entry falls back to the catalog price.
    if (shared && strategy === "global") {
      await tx
        .update(menuEntry)
        .set({ priceCentsOverride: null, priceLabelOverride: null })
        .where(eq(menuEntry.catalogItemId, itemId));
    }
  }
}

async function processEntryRow(
  tx: EditorTx,
  row: EntryRow & { kind: "entry" },
  opts: RowProcessingOpts
) {
  const existingCatalogItem =
    row.catalogItemId && opts.existingCatalogItemMap.has(row.catalogItemId)
      ? (opts.existingCatalogItemMap.get(row.catalogItemId) ?? null)
      : null;

  const catalogItemId = existingCatalogItem
    ? existingCatalogItem.id
    : (
        await tx
          .insert(catalogItem)
          .values({
            venueId: opts.venueId,
            slug: getUniqueSlug(row.title, opts.usedCatalogItemSlugs, "item"),
            title: row.title,
            description: row.description,
            priceCents: row.priceCents,
            priceLabel: row.priceLabel,
            allergens: row.allergens,
            features: row.features,
            additives: row.additives,
            imageUrl: row.imageUrl ?? null,
            isActive: true,
          })
          .returning({
            id: catalogItem.id,
          })
      )[0]?.id;

  if (!catalogItemId) {
    return;
  }

  opts.nextCatalogItemIds.add(catalogItemId);

  const shared = existingCatalogItem
    ? await isSharedCatalogItem(tx, existingCatalogItem.id, opts.menuId)
    : false;

  if (existingCatalogItem) {
    await updateCatalogItemFields(
      tx,
      existingCatalogItem.id,
      row,
      shared,
      opts.sharedCatalogStrategy
    );
  }

  // For shared + "local" strategy, store prices as entry-level overrides.
  // For shared + "global", clear any existing overrides so the entry
  // uses the catalog item's (now updated) base price.
  const isSharedLocal = shared && opts.sharedCatalogStrategy === "local";
  const isSharedGlobal = shared && opts.sharedCatalogStrategy === "global";

  let resolvedPriceCentsOverride: number | null | undefined;
  let resolvedPriceLabelOverride: string | null | undefined;
  if (isSharedLocal) {
    resolvedPriceCentsOverride = row.priceCents;
    resolvedPriceLabelOverride = row.priceLabel;
  } else if (isSharedGlobal) {
    resolvedPriceCentsOverride = null;
    resolvedPriceLabelOverride = null;
  } else {
    resolvedPriceCentsOverride = row.priceCentsOverride;
    resolvedPriceLabelOverride = row.priceLabelOverride;
  }

  const [insertedEntry] = await tx
    .insert(menuEntry)
    .values({
      id: row.id ?? undefined,
      menuId: opts.menuId,
      categoryId: opts.categoryId,
      kind: "entry",
      catalogItemId,
      sortOrder: opts.rowIndex,
      isVisible: row.isVisible,
      priceCentsOverride: resolvedPriceCentsOverride,
      priceLabelOverride: resolvedPriceLabelOverride,
    })
    .returning();
  opts.translationRows.push(
    ...createMenuEditorTranslationInserts({
      venueId: opts.venueId,
      entityType: "menu_entry",
      entityId: insertedEntry.id,
      translations: row.translations,
    })
  );
  opts.nextSnapshot.set(
    `entry:${insertedEntry.id}`,
    [row.title ?? "", row.description ?? ""].join("\0")
  );
}

async function isSharedCatalogItem(
  tx: EditorTx,
  catalogItemId: string,
  currentMenuId: string
): Promise<boolean> {
  const [usedElsewhere] = await tx
    .select({ id: menuEntry.id })
    .from(menuEntry)
    .where(
      and(
        eq(menuEntry.catalogItemId, catalogItemId),
        ne(menuEntry.menuId, currentMenuId)
      )
    )
    .limit(1);
  return Boolean(usedElsewhere);
}

async function cleanupOrphanedCatalogItems(
  tx: EditorTx,
  previousCatalogItemIds: Set<string>,
  nextCatalogItemIds: Set<string>
) {
  const removedCatalogItemIds = Array.from(previousCatalogItemIds).filter(
    (id) => !nextCatalogItemIds.has(id)
  );

  for (const id of removedCatalogItemIds) {
    const [usage] = await tx
      .select({ id: menuEntry.id })
      .from(menuEntry)
      .where(eq(menuEntry.catalogItemId, id))
      .limit(1);

    if (!usage) {
      await tx.delete(catalogItem).where(eq(catalogItem.id, id));
    }
  }
}

export async function updateMenuEditor({
  venueId,
  menuId,
  input,
  sharedCatalogStrategy,
}: UpdateMenuEditorInput): Promise<MenuEditorData> {
  await getMenu({ venueId, menuId });

  const previousEntryRows = await database
    .select({
      id: menuEntry.id,
      catalogItemId: menuEntry.catalogItemId,
      kind: menuEntry.kind,
      title: menuEntry.title,
      ciTitle: catalogItem.title,
      ciDescription: catalogItem.description,
    })
    .from(menuEntry)
    .leftJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
    .where(eq(menuEntry.menuId, menuId));
  const previousTabRows = await database
    .select({
      id: menuTab.id,
      label: menuTab.label,
    })
    .from(menuTab)
    .where(eq(menuTab.menuId, menuId));
  const previousCategoryRows = await database
    .select({
      id: menuCategory.id,
      title: menuCategory.title,
    })
    .from(menuCategory)
    .where(eq(menuCategory.menuId, menuId));

  const previousCatalogItemIds = new Set(
    previousEntryRows
      .map((entry) => entry.catalogItemId)
      .filter((catalogItemId): catalogItemId is string =>
        Boolean(catalogItemId)
      )
  );
  const previousTabIds = previousTabRows.map((tab) => tab.id);
  const previousCategoryIds = previousCategoryRows.map(
    (category) => category.id
  );
  const previousEntryIds = previousEntryRows.map((entry) => entry.id);

  // Build a snapshot of translatable field values to detect changes later
  const previousSnapshot = new Map<string, string>();
  for (const tab of previousTabRows) {
    previousSnapshot.set(`tab:${tab.id}`, tab.label ?? "");
  }
  for (const cat of previousCategoryRows) {
    previousSnapshot.set(`category:${cat.id}`, cat.title ?? "");
  }
  for (const entry of previousEntryRows) {
    const title = entry.kind === "group" ? entry.title : entry.ciTitle;
    const desc = entry.kind === "group" ? null : entry.ciDescription;
    previousSnapshot.set(
      `entry:${entry.id}`,
      [title ?? "", desc ?? ""].join("\0")
    );
  }

  const requestedCatalogItemIds = Array.from(
    new Set(
      input.tabs.flatMap((tab) =>
        tab.categories.flatMap((category) =>
          category.rows.flatMap((row) =>
            row.kind === "entry" && row.catalogItemId ? [row.catalogItemId] : []
          )
        )
      )
    )
  );

  const existingCatalogItems =
    requestedCatalogItemIds.length > 0
      ? await database
          .select({
            id: catalogItem.id,
            slug: catalogItem.slug,
          })
          .from(catalogItem)
          .where(inArray(catalogItem.id, requestedCatalogItemIds))
      : [];

  const existingCatalogItemMap = new Map(
    existingCatalogItems.map((item) => [item.id, item])
  );

  const existingVenueCatalogItems = await database
    .select({
      id: catalogItem.id,
      slug: catalogItem.slug,
    })
    .from(catalogItem)
    .where(eq(catalogItem.venueId, venueId));

  const nextCatalogItemIds = new Set<string>();
  const usedTabSlugs = new Set<string>();
  const usedCategorySlugs = new Set<string>();
  const usedCatalogItemSlugs = new Set(
    existingVenueCatalogItems.map((item) => item.slug)
  );

  const nextSnapshot = new Map<string, string>();

  await database.transaction(async (tx) => {
    await deleteOldTranslations(
      tx,
      previousTabIds,
      previousCategoryIds,
      previousEntryIds
    );

    await tx.delete(menuTab).where(eq(menuTab.menuId, menuId));
    const translationRows: TranslationInsert[] = [];

    const rowOpts = {
      venueId,
      menuId,
      categoryId: "",
      rowIndex: 0,
      existingCatalogItemMap,
      usedCatalogItemSlugs,
      nextCatalogItemIds,
      translationRows,
      nextSnapshot,
      sharedCatalogStrategy,
    };

    for (const [tabIndex, tab] of input.tabs.entries()) {
      const tabSlug = getUniqueSlug(
        tab.label,
        usedTabSlugs,
        `tab-${tabIndex + 1}`
      );

      const [insertedTab] = await tx
        .insert(menuTab)
        .values({
          id: tab.id ?? undefined,
          menuId,
          label: tab.label,
          slug: tabSlug,
          isVisible: tab.isVisible,
          sortOrder: tabIndex,
        })
        .returning();
      translationRows.push(
        ...createMenuEditorTranslationInserts({
          venueId,
          entityType: "menu_tab",
          entityId: insertedTab.id,
          translations: tab.translations,
          sourceRevision: insertedTab.sourceRevision,
        })
      );
      nextSnapshot.set(`tab:${insertedTab.id}`, tab.label ?? "");

      for (const [categoryIndex, category] of tab.categories.entries()) {
        const categorySlug = getUniqueSlug(
          category.title,
          usedCategorySlugs,
          `category-${categoryIndex + 1}`
        );

        const [insertedCategory] = await tx
          .insert(menuCategory)
          .values({
            id: category.id ?? undefined,
            menuId,
            tabId: insertedTab.id,
            slug: categorySlug,
            title: category.title,
            isVisible: category.isVisible,
            sortOrder: categoryIndex,
          })
          .returning();
        translationRows.push(
          ...createMenuEditorTranslationInserts({
            venueId,
            entityType: "menu_category",
            entityId: insertedCategory.id,
            translations: category.translations,
            sourceRevision: insertedCategory.sourceRevision,
          })
        );
        nextSnapshot.set(
          `category:${insertedCategory.id}`,
          category.title ?? ""
        );

        for (const [rowIndex, row] of category.rows.entries()) {
          const entryOpts = {
            ...rowOpts,
            categoryId: insertedCategory.id,
            rowIndex,
          };
          if (row.kind === "group") {
            await processGroupRow(tx, row, entryOpts);
            continue;
          }

          await processEntryRow(tx, row, entryOpts);
        }
      }
    }

    if (translationRows.length > 0) {
      await tx.insert(contentTranslation).values(translationRows);
    }

    await cleanupOrphanedCatalogItems(
      tx,
      previousCatalogItemIds,
      nextCatalogItemIds
    );
  });

  // Only trigger auto-translation when translatable fields actually changed
  const translatableFieldsChanged = (() => {
    if (nextSnapshot.size !== previousSnapshot.size) {
      return true;
    }
    for (const [key, nextVal] of nextSnapshot) {
      const prevVal = previousSnapshot.get(key);
      if (prevVal === undefined || prevVal !== nextVal) {
        return true;
      }
    }
    return false;
  })();

  if (translatableFieldsChanged) {
    getVenueSecondaryLocaleCodes(venueId)
      .then((secondaryLocales) => {
        if (secondaryLocales.length > 0) {
          return startTranslationRun(venueId, {
            locales: secondaryLocales,
            missingOnly: true,
          });
        }
        return null;
      })
      .catch(() => {
        // Intentionally swallowed — fire-and-forget translation
      });
  }

  return await getMenuEditor({ venueId, menuId });
}
