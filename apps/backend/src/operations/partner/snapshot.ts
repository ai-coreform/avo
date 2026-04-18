import { and, eq, notInArray } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import type {
  SnapshotBody,
  SnapshotCatalogItem,
  SnapshotCategory,
  SnapshotEntry,
  SnapshotMenu,
  SnapshotTab,
} from "@/routes/partner/snapshot.schemas";
import { uniqueSlug } from "./shared/slug";

/**
 * Apply a full catalog + menu tree snapshot atomically.
 *
 * Semantics:
 * - Full-replace within the partner's scope: any top-level row with
 *   `external_source = source` for this venue that is NOT in the payload
 *   gets deleted (cascade).
 * - Rows with `external_source = null` (Avo-native) are preserved.
 * - `catalog_item_external_id` references resolve against items declared
 *   in this payload first, then against already-persisted items.
 * - One DB transaction — any failure rolls back the whole apply.
 */

// ──────────────────────────────────────────────────────────────
// Result types
// ──────────────────────────────────────────────────────────────

type UpsertStatus = "created" | "updated" | "unchanged";

export interface SnapshotCatalogItemResult {
  external_id: string;
  avo_id: string;
  status: UpsertStatus;
}

export interface SnapshotEntryResult {
  external_id?: string;
  avo_id: string;
}

export interface SnapshotCategoryResult {
  external_id?: string;
  avo_id: string;
  entries: SnapshotEntryResult[];
}

export interface SnapshotTabResult {
  external_id?: string;
  avo_id: string;
  categories: SnapshotCategoryResult[];
}

export interface SnapshotMenuResult {
  external_id?: string;
  avo_id: string;
  status: UpsertStatus;
  tabs: SnapshotTabResult[];
}

export interface SnapshotApplyResult {
  catalog_items: SnapshotCatalogItemResult[];
  menus: SnapshotMenuResult[];
}

interface SnapshotError {
  kind: "error";
  code: "invalid_reference" | "validation_failed";
  message: string;
  field?: string;
}

interface SnapshotApplyOk {
  kind: "ok";
  result: SnapshotApplyResult;
}

export type SnapshotApplyOutcome = SnapshotApplyOk | SnapshotError;

interface OkMarker {
  kind: "ok";
}

// ──────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────

export async function applySnapshot(
  venueId: string,
  body: SnapshotBody,
  options: { source?: string } = {}
): Promise<SnapshotApplyOutcome> {
  const source = options.source ?? PARTNER_SOURCE;

  const preCheck = validatePayloadShape(body);
  if (preCheck.kind === "error") {
    return preCheck;
  }

  const declaredCatalogExternalIds = new Set(
    (body.catalog_items ?? []).map((i) => i.external_id)
  );
  const preExistingMap = await loadPartnerCatalogMap(venueId, source);

  const missingRef = findMissingCatalogItemRef(
    body,
    declaredCatalogExternalIds,
    preExistingMap
  );
  if (missingRef) {
    return {
      kind: "error",
      code: "invalid_reference",
      message: `catalog_item_external_id '${missingRef}' does not exist in the snapshot or in this venue.`,
      field: "entries.catalog_item_external_id",
    };
  }

  return await database.transaction(async (tx) => {
    const catalogResults = await upsertCatalogItems(
      tx,
      venueId,
      body.catalog_items ?? [],
      source
    );

    const catalogIdMap = new Map<string, string>(preExistingMap);
    for (const r of catalogResults) {
      catalogIdMap.set(r.external_id, r.avo_id);
    }

    const menuResults: SnapshotMenuResult[] = [];
    for (const m of body.menus ?? []) {
      const menuResult = await applyMenu(tx, venueId, m, catalogIdMap, source);
      menuResults.push(menuResult);
    }

    await deleteOrphanedTopLevelRows(tx, venueId, source, {
      keptCatalogExternalIds: declaredCatalogExternalIds,
      keptMenuExternalIds: new Set(
        (body.menus ?? [])
          .map((m) => m.external_id)
          .filter((x): x is string => !!x)
      ),
    });

    return {
      kind: "ok" as const,
      result: { catalog_items: catalogResults, menus: menuResults },
    };
  });
}

async function loadPartnerCatalogMap(
  venueId: string,
  source: string
): Promise<Map<string, string>> {
  const rows = await database
    .select({ id: catalogItem.id, externalId: catalogItem.externalId })
    .from(catalogItem)
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        eq(catalogItem.externalSource, source)
      )
    );
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.externalId) {
      map.set(r.externalId, r.id);
    }
  }
  return map;
}

// ──────────────────────────────────────────────────────────────
// Pre-validation (split by resource to keep complexity low)
// ──────────────────────────────────────────────────────────────

function validatePayloadShape(body: SnapshotBody): SnapshotError | OkMarker {
  const catalogCheck = validateCatalogDedup(body.catalog_items ?? []);
  if (catalogCheck) {
    return catalogCheck;
  }

  const seenMenus = new Set<string>();
  for (const m of body.menus ?? []) {
    const menuDup = registerExternalId(
      m.external_id,
      seenMenus,
      "menus.external_id",
      `Duplicate menu external_id '${m.external_id ?? ""}' in payload.`
    );
    if (menuDup) {
      return menuDup;
    }

    const menuErr = validateMenu(m);
    if (menuErr) {
      return menuErr;
    }
  }

  return { kind: "ok" };
}

function validateCatalogDedup(
  items: SnapshotCatalogItem[]
): SnapshotError | null {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.external_id)) {
      return {
        kind: "error",
        code: "validation_failed",
        message: `Duplicate catalog_item external_id '${item.external_id}' in payload.`,
        field: "catalog_items.external_id",
      };
    }
    seen.add(item.external_id);
  }
  return null;
}

function validateMenu(m: SnapshotMenu): SnapshotError | null {
  const seenTabs = new Set<string>();
  for (const t of m.tabs ?? []) {
    const dup = registerExternalId(
      t.external_id,
      seenTabs,
      "menus.tabs.external_id",
      `Duplicate tab external_id '${t.external_id ?? ""}' in menu '${m.title}'.`
    );
    if (dup) {
      return dup;
    }

    const tabErr = validateTab(t);
    if (tabErr) {
      return tabErr;
    }
  }
  return null;
}

function validateTab(t: SnapshotTab): SnapshotError | null {
  const seenCategories = new Set<string>();
  for (const cat of t.categories ?? []) {
    const dup = registerExternalId(
      cat.external_id,
      seenCategories,
      "menus.tabs.categories.external_id",
      `Duplicate category external_id '${cat.external_id ?? ""}' in tab '${t.title}'.`
    );
    if (dup) {
      return dup;
    }

    const catErr = validateCategory(cat);
    if (catErr) {
      return catErr;
    }
  }
  return null;
}

function validateCategory(cat: SnapshotCategory): SnapshotError | null {
  const seenEntries = new Set<string>();
  for (const entry of cat.entries ?? []) {
    const shapeErr = validateEntryShape(entry);
    if (shapeErr) {
      return shapeErr;
    }

    const dup = registerExternalId(
      entry.external_id,
      seenEntries,
      "menus.tabs.categories.entries.external_id",
      `Duplicate entry external_id '${entry.external_id ?? ""}' in category '${cat.title}'.`
    );
    if (dup) {
      return dup;
    }
  }
  return null;
}

function validateEntryShape(entry: SnapshotEntry): SnapshotError | null {
  const kind = entry.kind ?? "entry";
  if (kind === "entry" && !entry.catalog_item_external_id) {
    return {
      kind: "error",
      code: "validation_failed",
      message:
        "Entries of kind='entry' require catalog_item_external_id in a snapshot.",
      field: "menus.tabs.categories.entries.catalog_item_external_id",
    };
  }
  if (kind === "group") {
    if (!entry.title || entry.title.trim().length === 0) {
      return {
        kind: "error",
        code: "validation_failed",
        message: "Entries of kind='group' require a title.",
        field: "menus.tabs.categories.entries.title",
      };
    }
    if (entry.catalog_item_external_id) {
      return {
        kind: "error",
        code: "validation_failed",
        message: "Entries of kind='group' cannot reference a catalog_item.",
        field: "menus.tabs.categories.entries.catalog_item_external_id",
      };
    }
  }
  return null;
}

function registerExternalId(
  value: string | undefined | null,
  seen: Set<string>,
  field: string,
  message: string
): SnapshotError | null {
  if (!value) {
    return null;
  }
  if (seen.has(value)) {
    return {
      kind: "error",
      code: "validation_failed",
      message,
      field,
    };
  }
  seen.add(value);
  return null;
}

function findMissingCatalogItemRef(
  body: SnapshotBody,
  declared: Set<string>,
  preExisting: Map<string, string>
): string | null {
  for (const m of body.menus ?? []) {
    const miss = findMissingInMenu(m, declared, preExisting);
    if (miss) {
      return miss;
    }
  }
  return null;
}

function findMissingInMenu(
  m: SnapshotMenu,
  declared: Set<string>,
  preExisting: Map<string, string>
): string | null {
  for (const t of m.tabs ?? []) {
    for (const cat of t.categories ?? []) {
      for (const entry of cat.entries ?? []) {
        if ((entry.kind ?? "entry") !== "entry") {
          continue;
        }
        const ref = entry.catalog_item_external_id;
        if (ref && !(declared.has(ref) || preExisting.has(ref))) {
          return ref;
        }
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Upsert helpers
// ──────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof database.transaction>[0]>[0];

async function upsertCatalogItems(
  tx: Tx,
  venueId: string,
  items: SnapshotCatalogItem[],
  source: string
): Promise<SnapshotCatalogItemResult[]> {
  const results: SnapshotCatalogItemResult[] = [];
  for (const input of items) {
    results.push(await upsertOneCatalogItem(tx, venueId, input, source));
  }
  return results;
}

async function upsertOneCatalogItem(
  tx: Tx,
  venueId: string,
  input: SnapshotCatalogItem,
  source: string
): Promise<SnapshotCatalogItemResult> {
  const [existing] = await tx
    .select()
    .from(catalogItem)
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        eq(catalogItem.externalSource, source),
        eq(catalogItem.externalId, input.external_id)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await tx
      .update(catalogItem)
      .set(toCatalogItemValues(input))
      .where(eq(catalogItem.id, existing.id))
      .returning();

    return {
      external_id: input.external_id,
      avo_id: existing.id,
      status:
        updated.updatedAt.getTime() !== existing.updatedAt.getTime()
          ? "updated"
          : "unchanged",
    };
  }

  const slug = await uniqueSlug(input.title, {
    table: catalogItem,
    slugColumn: catalogItem.slug,
    scope: [{ column: catalogItem.venueId, value: venueId }],
  });

  const [created] = await tx
    .insert(catalogItem)
    .values({
      ...toCatalogItemValues(input),
      venueId,
      slug,
      externalId: input.external_id,
      externalSource: source,
    })
    .returning();

  return {
    external_id: input.external_id,
    avo_id: created.id,
    status: "created",
  };
}

function toCatalogItemValues(input: SnapshotCatalogItem) {
  return {
    title: input.title,
    description: input.description ?? null,
    priceCents: input.price_cents ?? null,
    priceLabel: input.price_label ?? null,
    allergens: (input.allergens ??
      []) as typeof catalogItem.$inferInsert.allergens,
    features: (input.features ??
      []) as typeof catalogItem.$inferInsert.features,
    additives: (input.additives ??
      []) as typeof catalogItem.$inferInsert.additives,
    imageUrl: input.image_url ?? null,
    isActive: input.is_active ?? true,
  };
}

interface UpsertedMenuHandle {
  avo_id: string;
  external_id?: string;
  status: UpsertStatus;
}

async function applyMenu(
  tx: Tx,
  venueId: string,
  input: SnapshotMenu,
  catalogIdMap: Map<string, string>,
  source: string
): Promise<SnapshotMenuResult> {
  const menuHandle = await upsertMenu(tx, venueId, input, source);

  const tabResults: SnapshotTabResult[] = [];
  for (const t of input.tabs ?? []) {
    const tabResult = await applyTab(
      tx,
      menuHandle.avo_id,
      t,
      catalogIdMap,
      source
    );
    tabResults.push(tabResult);
  }

  return {
    avo_id: menuHandle.avo_id,
    external_id: menuHandle.external_id,
    status: menuHandle.status,
    tabs: tabResults,
  };
}

async function applyTab(
  tx: Tx,
  menuId: string,
  input: SnapshotTab,
  catalogIdMap: Map<string, string>,
  source: string
): Promise<SnapshotTabResult> {
  const tabHandle = await upsertTab(tx, menuId, input, source);

  const categoryResults: SnapshotCategoryResult[] = [];
  for (const cat of input.categories ?? []) {
    const categoryResult = await applyCategory(
      tx,
      menuId,
      tabHandle.avo_id,
      cat,
      catalogIdMap,
      source
    );
    categoryResults.push(categoryResult);
  }

  return {
    avo_id: tabHandle.avo_id,
    external_id: tabHandle.external_id,
    categories: categoryResults,
  };
}

async function applyCategory(
  tx: Tx,
  menuId: string,
  tabId: string,
  input: SnapshotCategory,
  catalogIdMap: Map<string, string>,
  source: string
): Promise<SnapshotCategoryResult> {
  const categoryHandle = await upsertCategory(tx, menuId, tabId, input, source);

  const entryResults: SnapshotEntryResult[] = [];
  for (const entry of input.entries ?? []) {
    const entryResult = await upsertEntry(
      tx,
      menuId,
      categoryHandle.avo_id,
      entry,
      catalogIdMap,
      source
    );
    entryResults.push(entryResult);
  }

  return {
    avo_id: categoryHandle.avo_id,
    external_id: categoryHandle.external_id,
    entries: entryResults,
  };
}

async function upsertMenu(
  tx: Tx,
  venueId: string,
  input: SnapshotMenu,
  source: string
): Promise<UpsertedMenuHandle> {
  const existing = input.external_id
    ? ((
        await tx
          .select()
          .from(menu)
          .where(
            and(
              eq(menu.venueId, venueId),
              eq(menu.externalSource, source),
              eq(menu.externalId, input.external_id)
            )
          )
          .limit(1)
      )[0] ?? null)
    : null;

  if (existing) {
    const nextStatus = input.status ?? existing.status;
    const shouldSetPublishedAt =
      nextStatus === "published" && !existing.publishedAt;

    const [updated] = await tx
      .update(menu)
      .set({
        name: input.title,
        status: nextStatus,
        sortOrder: input.sort_order ?? existing.sortOrder,
        publishedAt: shouldSetPublishedAt ? new Date() : existing.publishedAt,
      })
      .where(eq(menu.id, existing.id))
      .returning();

    return {
      avo_id: existing.id,
      external_id: input.external_id,
      status:
        updated.updatedAt.getTime() !== existing.updatedAt.getTime()
          ? "updated"
          : "unchanged",
    };
  }

  const slug = await uniqueSlug(input.title, {
    table: menu,
    slugColumn: menu.slug,
    scope: [{ column: menu.venueId, value: venueId }],
  });

  const isPublished = input.status === "published";

  const [created] = await tx
    .insert(menu)
    .values({
      venueId,
      name: input.title,
      slug,
      status: input.status ?? "draft",
      sortOrder: input.sort_order ?? 0,
      publishedAt: isPublished ? new Date() : null,
      externalId: input.external_id ?? null,
      externalSource: input.external_id ? source : null,
    })
    .returning();

  return {
    avo_id: created.id,
    external_id: input.external_id,
    status: "created",
  };
}

interface UpsertedHandle {
  avo_id: string;
  external_id?: string;
}

async function upsertTab(
  tx: Tx,
  menuId: string,
  input: SnapshotTab,
  source: string
): Promise<UpsertedHandle> {
  const existing = input.external_id
    ? ((
        await tx
          .select()
          .from(menuTab)
          .where(
            and(
              eq(menuTab.menuId, menuId),
              eq(menuTab.externalSource, source),
              eq(menuTab.externalId, input.external_id)
            )
          )
          .limit(1)
      )[0] ?? null)
    : null;

  if (existing) {
    await tx
      .update(menuTab)
      .set({
        label: input.title,
        isVisible: input.is_visible ?? existing.isVisible,
        sortOrder: input.sort_order ?? existing.sortOrder,
      })
      .where(eq(menuTab.id, existing.id));
    return { avo_id: existing.id, external_id: input.external_id };
  }

  const slug = await uniqueSlug(input.title, {
    table: menuTab,
    slugColumn: menuTab.slug,
    scope: [{ column: menuTab.menuId, value: menuId }],
  });

  const [created] = await tx
    .insert(menuTab)
    .values({
      menuId,
      label: input.title,
      slug,
      isVisible: input.is_visible ?? true,
      sortOrder: input.sort_order ?? 0,
      externalId: input.external_id ?? null,
      externalSource: input.external_id ? source : null,
    })
    .returning();

  return { avo_id: created.id, external_id: input.external_id };
}

async function upsertCategory(
  tx: Tx,
  menuId: string,
  tabId: string,
  input: SnapshotCategory,
  source: string
): Promise<UpsertedHandle> {
  const existing = input.external_id
    ? ((
        await tx
          .select()
          .from(menuCategory)
          .where(
            and(
              eq(menuCategory.menuId, menuId),
              eq(menuCategory.externalSource, source),
              eq(menuCategory.externalId, input.external_id)
            )
          )
          .limit(1)
      )[0] ?? null)
    : null;

  if (existing) {
    await tx
      .update(menuCategory)
      .set({
        tabId,
        title: input.title,
        isVisible: input.is_visible ?? existing.isVisible,
        sortOrder: input.sort_order ?? existing.sortOrder,
      })
      .where(eq(menuCategory.id, existing.id));
    return { avo_id: existing.id, external_id: input.external_id };
  }

  const slug = await uniqueSlug(input.title, {
    table: menuCategory,
    slugColumn: menuCategory.slug,
    scope: [{ column: menuCategory.menuId, value: menuId }],
  });

  const [created] = await tx
    .insert(menuCategory)
    .values({
      menuId,
      tabId,
      title: input.title,
      slug,
      isVisible: input.is_visible ?? true,
      sortOrder: input.sort_order ?? 0,
      externalId: input.external_id ?? null,
      externalSource: input.external_id ? source : null,
    })
    .returning();

  return { avo_id: created.id, external_id: input.external_id };
}

async function upsertEntry(
  tx: Tx,
  menuId: string,
  categoryId: string,
  input: SnapshotEntry,
  catalogIdMap: Map<string, string>,
  source: string
): Promise<SnapshotEntryResult> {
  const kind = input.kind ?? "entry";
  const catalogItemId =
    kind === "entry" && input.catalog_item_external_id
      ? (catalogIdMap.get(input.catalog_item_external_id) ?? null)
      : null;

  const existing = input.external_id
    ? ((
        await tx
          .select()
          .from(menuEntry)
          .where(
            and(
              eq(menuEntry.menuId, menuId),
              eq(menuEntry.externalSource, source),
              eq(menuEntry.externalId, input.external_id)
            )
          )
          .limit(1)
      )[0] ?? null)
    : null;

  if (existing) {
    await tx
      .update(menuEntry)
      .set({
        categoryId,
        kind,
        title: input.title ?? null,
        catalogItemId,
        sortOrder: input.sort_order ?? existing.sortOrder,
        isVisible: input.is_visible ?? existing.isVisible,
        priceCentsOverride: input.price_cents_override ?? null,
        priceLabelOverride: input.price_label_override ?? null,
      })
      .where(eq(menuEntry.id, existing.id));
    return { external_id: input.external_id, avo_id: existing.id };
  }

  const [created] = await tx
    .insert(menuEntry)
    .values({
      menuId,
      categoryId,
      kind,
      title: input.title ?? null,
      catalogItemId,
      sortOrder: input.sort_order ?? 0,
      isVisible: input.is_visible ?? true,
      priceCentsOverride: input.price_cents_override ?? null,
      priceLabelOverride: input.price_label_override ?? null,
      externalId: input.external_id ?? null,
      externalSource: input.external_id ? source : null,
    })
    .returning();

  return { external_id: input.external_id, avo_id: created.id };
}

// ──────────────────────────────────────────────────────────────
// Full-replace cleanup (top-level only in v1)
// ──────────────────────────────────────────────────────────────

async function deleteOrphanedTopLevelRows(
  tx: Tx,
  venueId: string,
  source: string,
  kept: {
    keptCatalogExternalIds: Set<string>;
    keptMenuExternalIds: Set<string>;
  }
): Promise<void> {
  await deleteOrphanCatalogItems(
    tx,
    venueId,
    source,
    Array.from(kept.keptCatalogExternalIds)
  );
  await deleteOrphanMenus(
    tx,
    venueId,
    source,
    Array.from(kept.keptMenuExternalIds)
  );
  // Deep orphan cleanup inside kept menus (tabs/categories/entries not in
  // payload) is deliberately NOT performed here. The upsert pass applies
  // whatever content is in the snapshot; if Connect wants partial-replace
  // semantics inside a menu they use the per-resource CRUD endpoints.
}

async function deleteOrphanCatalogItems(
  tx: Tx,
  venueId: string,
  source: string,
  kept: string[]
): Promise<void> {
  if (kept.length === 0) {
    await tx
      .delete(catalogItem)
      .where(
        and(
          eq(catalogItem.venueId, venueId),
          eq(catalogItem.externalSource, source)
        )
      );
    return;
  }
  await tx
    .delete(catalogItem)
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        eq(catalogItem.externalSource, source),
        notInArray(catalogItem.externalId, kept)
      )
    );
}

async function deleteOrphanMenus(
  tx: Tx,
  venueId: string,
  source: string,
  kept: string[]
): Promise<void> {
  if (kept.length === 0) {
    await tx
      .delete(menu)
      .where(and(eq(menu.venueId, venueId), eq(menu.externalSource, source)));
    return;
  }
  await tx
    .delete(menu)
    .where(
      and(
        eq(menu.venueId, venueId),
        eq(menu.externalSource, source),
        notInArray(menu.externalId, kept)
      )
    );
}
