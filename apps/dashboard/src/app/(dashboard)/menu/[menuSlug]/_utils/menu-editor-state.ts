import type { CatalogItemListItem } from "@/api/catalog-items/types";
import type {
  MenuEditorCategory,
  MenuEditorData,
  MenuEditorEntryRow,
  MenuEditorGroupRow,
  MenuEditorRow,
  MenuEditorTab,
  UpdateMenuEditorInput,
} from "@/api/menu/types";

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Backend stores prices as integer cents. The editor inputs are labelled in
 * euros ("Prezzo (€)" / placeholder "20.00"), so we convert at the boundary:
 *   - load:  cents (900)   → euro string ("9.00")
 *   - save:  euro string   → cents (900)
 */
function centsToEuroString(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

function euroStringToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const euros = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(euros)) {
    return null;
  }
  return Math.round(euros * 100);
}

export type LocalMenuEditorGroupRow = Omit<MenuEditorGroupRow, "id"> & {
  localId: string;
  id: string | null;
};

export type LocalMenuEditorEntryRow = Omit<
  MenuEditorEntryRow,
  | "id"
  | "catalogItemId"
  | "description"
  | "priceCents"
  | "priceLabel"
  | "priceCentsOverride"
  | "priceLabelOverride"
> & {
  localId: string;
  id: string | null;
  catalogItemId: string | null;
  description: string;
  priceCents: string;
  priceLabel: string;
  priceCentsOverride: string;
  priceLabelOverride: string;
  imageUrl: string | null;
};

export type LocalMenuEditorRow =
  | LocalMenuEditorGroupRow
  | LocalMenuEditorEntryRow;

export type LocalMenuEditorCategory = Omit<
  MenuEditorCategory,
  "id" | "rows"
> & {
  localId: string;
  id: string | null;
  rows: LocalMenuEditorRow[];
};

export type LocalMenuEditorTab = Omit<MenuEditorTab, "id" | "categories"> & {
  localId: string;
  id: string | null;
  categories: LocalMenuEditorCategory[];
};

export interface LocalMenuEditorState {
  menu: MenuEditorData["menu"];
  tabs: LocalMenuEditorTab[];
}

export function createEmptyMenuEditorEntryRow(): LocalMenuEditorEntryRow {
  return {
    localId: createLocalId("entry"),
    kind: "entry",
    id: null,
    catalogItemId: null,
    isShared: false,
    title: "Nuova voce",
    description: "",
    priceCents: "",
    priceLabel: "",
    allergens: [],
    features: [],
    additives: [],
    imageUrl: null,
    isVisible: true,
    priceCentsOverride: "",
    priceLabelOverride: "",
    translations: {},
  };
}

export function createMenuEditorEntryFromCatalogItem(
  item: CatalogItemListItem
): LocalMenuEditorEntryRow {
  return {
    localId: createLocalId("entry"),
    kind: "entry",
    id: null,
    catalogItemId: item.id,
    isShared: false,
    title: item.title,
    description: item.description ?? "",
    priceCents: centsToEuroString(item.priceCents),
    priceLabel: item.priceLabel ?? "",
    allergens: [...item.allergens],
    features: [...item.features],
    additives: [...item.additives],
    imageUrl: item.imageUrl ?? null,
    isVisible: true,
    priceCentsOverride: "",
    priceLabelOverride: "",
    translations: {},
  };
}

export function createEmptyMenuEditorGroupRow(): LocalMenuEditorGroupRow {
  return {
    localId: createLocalId("group"),
    kind: "group",
    id: null,
    title: "Nuovo gruppo",
    isVisible: true,
    translations: {},
  };
}

export function createEmptyMenuEditorCategory(): LocalMenuEditorCategory {
  return {
    localId: createLocalId("category"),
    id: null,
    title: "Nuova categoria",
    isVisible: true,
    translations: {},
    rows: [],
  };
}

export function createEmptyMenuEditorTab(): LocalMenuEditorTab {
  return {
    localId: createLocalId("tab"),
    id: null,
    label: "Nuova tab",
    slug: "",
    isVisible: true,
    translations: {},
    categories: [],
  };
}

export function buildMenuEditorLocalState(
  data: MenuEditorData
): LocalMenuEditorState {
  return {
    menu: data.menu,
    tabs: data.tabs.map((tab) => ({
      ...tab,
      localId: createLocalId("tab"),
      translations: tab.translations ?? {},
      categories: tab.categories.map((category) => ({
        ...category,
        localId: createLocalId("category"),
        translations: category.translations ?? {},
        rows: category.rows.map((row) =>
          row.kind === "group"
            ? {
                ...row,
                title: row.title.trim() || "Nuovo gruppo",
                translations: row.translations ?? {},
                localId: createLocalId("group"),
              }
            : {
                ...row,
                title: row.title.trim() || "Nuova voce",
                localId: createLocalId("entry"),
                translations: row.translations ?? {},
                description: row.description ?? "",
                priceCents: centsToEuroString(
                  row.priceCentsOverride ?? row.priceCents
                ),
                priceLabel: row.priceLabelOverride ?? row.priceLabel ?? "",
                allergens: row.allergens ?? [],
                features: row.features ?? [],
                additives: row.additives ?? [],
                imageUrl: row.imageUrl ?? null,
                priceCentsOverride: centsToEuroString(row.priceCentsOverride),
                priceLabelOverride: row.priceLabelOverride ?? "",
              }
        ),
      })),
    })),
  };
}

export function cloneMenuEditorLocalState(state: LocalMenuEditorState) {
  return structuredClone(state);
}

export function buildMenuEditorPayload(
  state: LocalMenuEditorState
): UpdateMenuEditorInput {
  return {
    tabs: state.tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      isVisible: tab.isVisible,
      translations: tab.translations,
      categories: tab.categories.map((category) => ({
        id: category.id,
        title: category.title,
        isVisible: category.isVisible,
        translations: category.translations,
        rows: category.rows.map<MenuEditorRow>((row) => {
          const trimmedTitle = row.title.trim();

          if (row.kind === "group") {
            return {
              kind: "group",
              id: row.id,
              title: trimmedTitle || (row.id ? "Nuovo gruppo" : ""),
              isVisible: row.isVisible,
              translations: row.translations,
            };
          }

          return {
            kind: "entry",
            id: row.id,
            catalogItemId: row.catalogItemId,
            isShared: row.isShared,
            title: trimmedTitle || (row.id ? "Nuova voce" : ""),
            description: toNullableString(row.description),
            priceCents: euroStringToCents(row.priceCents),
            priceLabel: toNullableString(row.priceLabel),
            allergens: row.allergens,
            features: row.features,
            additives: row.additives,
            imageUrl: row.imageUrl,
            isVisible: row.isVisible,
            priceCentsOverride: euroStringToCents(row.priceCentsOverride),
            priceLabelOverride: toNullableString(row.priceLabelOverride),
            translations: row.translations,
          };
        }),
      })),
    })),
  };
}

export function countCategoryEntries(category: LocalMenuEditorCategory) {
  return category.rows.filter((row) => row.kind === "entry").length;
}

function getAllEntryRows(state: LocalMenuEditorState) {
  return state.tabs.flatMap((tab) =>
    tab.categories.flatMap((category) =>
      category.rows.filter(
        (row): row is LocalMenuEditorEntryRow => row.kind === "entry"
      )
    )
  );
}

function isSharedEntryModified(
  entry: LocalMenuEditorEntryRow,
  prev: LocalMenuEditorEntryRow
): boolean {
  return (
    entry.title !== prev.title ||
    entry.description !== prev.description ||
    entry.priceCents !== prev.priceCents ||
    entry.priceLabel !== prev.priceLabel ||
    entry.imageUrl !== prev.imageUrl ||
    JSON.stringify(entry.allergens) !== JSON.stringify(prev.allergens) ||
    JSON.stringify(entry.features) !== JSON.stringify(prev.features) ||
    JSON.stringify(entry.additives) !== JSON.stringify(prev.additives)
  );
}

/**
 * Returns true if any shared catalog entry has been modified
 * compared to the snapshot (catalog-level fields only).
 */
export function hasModifiedSharedEntries(
  current: LocalMenuEditorState,
  snapshot: LocalMenuEditorState
): boolean {
  return getModifiedSharedEntries(current, snapshot).length > 0;
}

export interface ModifiedSharedEntry {
  title: string;
  priceChanged: boolean;
}

/**
 * Returns the list of shared catalog entries that have been modified,
 * with details about what changed.
 */
export function getModifiedSharedEntries(
  current: LocalMenuEditorState,
  snapshot: LocalMenuEditorState
): ModifiedSharedEntry[] {
  const currentEntries = getAllEntryRows(current);
  const snapshotById = new Map(
    getAllEntryRows(snapshot)
      .filter((e) => e.id !== null)
      .map((e) => [e.id, e])
  );

  const results: ModifiedSharedEntry[] = [];

  for (const entry of currentEntries) {
    if (!(entry.isShared && entry.id)) {
      continue;
    }

    const prev = snapshotById.get(entry.id);
    if (!prev) {
      continue;
    }

    if (isSharedEntryModified(entry, prev)) {
      results.push({
        title: entry.title,
        priceChanged:
          entry.priceCents !== prev.priceCents ||
          entry.priceLabel !== prev.priceLabel,
      });
    }
  }

  return results;
}
