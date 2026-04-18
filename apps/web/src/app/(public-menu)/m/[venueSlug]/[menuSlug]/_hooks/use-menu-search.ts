"use client";

import { useCallback, useMemo, useState } from "react";
import type { PublicMenuEntry, PublicMenuTab } from "@/api/public-menu/types";
import {
  buildMenuSearchIndex,
  searchMenuItems,
} from "../_utils/menu-search-engine";

export function useMenuSearch(tabs: PublicMenuTab[]) {
  const [query, setQuery] = useState("");

  const allEntries = useMemo(() => {
    const entries: PublicMenuEntry[] = [];
    for (const tab of tabs) {
      for (const category of tab.categories) {
        for (const entry of category.entries) {
          entries.push(entry);
        }
      }
    }
    return entries;
  }, [tabs]);

  const searchIndex = useMemo(
    () => buildMenuSearchIndex(allEntries),
    [allEntries]
  );

  const results = useMemo(
    () => searchMenuItems(searchIndex, query),
    [searchIndex, query]
  );

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    results,
    search,
    clearSearch,
    hasResults: results.length > 0,
    isSearching: query.length > 0,
  };
}
