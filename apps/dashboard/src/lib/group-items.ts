interface ItemWithSubcategory {
  subcategory?: string | null;
}

export interface ItemSubcategoryGroup<TItem extends ItemWithSubcategory> {
  name: string | null;
  items: TItem[];
}

/**
 * Groups items by their optional subcategory.
 * Items without a subcategory always appear first so they don't look like they
 * belong to the heading below them.
 * When `subcategoryOrder` is provided, named groups follow that order.
 */
export function groupItemsBySubcategory<TItem extends ItemWithSubcategory>(
  items: TItem[],
  subcategoryOrder?: string[]
): ItemSubcategoryGroup<TItem>[] {
  const seen = new Map<string | null, TItem[]>();

  for (const item of items) {
    const key = item.subcategory || null;
    const existingItems = seen.get(key);
    if (existingItems) {
      existingItems.push(item);
      continue;
    }

    seen.set(key, [item]);
  }

  const result: ItemSubcategoryGroup<TItem>[] = [];

  const uncategorizedItems = seen.get(null);
  if (uncategorizedItems) {
    result.push({ name: null, items: uncategorizedItems });
  }

  if (!subcategoryOrder || subcategoryOrder.length === 0) {
    for (const [name, subcategoryItems] of seen) {
      if (name !== null) {
        result.push({ name, items: subcategoryItems });
      }
    }

    return result;
  }

  const used = new Set<string | null>([null]);

  for (const name of subcategoryOrder) {
    const subcategoryItems = seen.get(name);
    if (subcategoryItems) {
      result.push({ name, items: subcategoryItems });
      used.add(name);
    }
  }

  for (const [name, subcategoryItems] of seen) {
    if (!used.has(name)) {
      result.push({ name, items: subcategoryItems });
    }
  }

  return result;
}
