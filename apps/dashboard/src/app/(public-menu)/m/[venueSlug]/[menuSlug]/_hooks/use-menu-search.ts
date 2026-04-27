"use client";

import { useCallback, useMemo, useState } from "react";
import type { PublicMenuEntry, PublicMenuTab } from "@/api/public-menu/types";
import {
  buildMenuSearchIndex,
  searchMenuItems,
} from "../_utils/menu-search-engine";

export interface SearchResultGroup {
  categoryId: string;
  categoryName: string;
  entries: PublicMenuEntry[];
}

export function useMenuSearch(tabs: PublicMenuTab[]) {
  const [query, setQuery] = useState("");

  const { allEntries, categoryMap } = useMemo(() => {
    const entries: PublicMenuEntry[] = [];
    const catMap = new Map<string, { id: string; title: string }>();
    for (const tab of tabs) {
      for (const category of tab.categories) {
        for (const entry of category.entries) {
          entries.push(entry);
          catMap.set(entry.id, { id: category.id, title: category.title });
        }
      }
    }
    return { allEntries: entries, categoryMap: catMap };
  }, [tabs]);

  const searchIndex = useMemo(
    () => buildMenuSearchIndex(allEntries),
    [allEntries]
  );

  const results = useMemo(
    () => searchMenuItems(searchIndex, query),
    [searchIndex, query]
  );

  const groupedResults = useMemo((): SearchResultGroup[] => {
    const groups: SearchResultGroup[] = [];
    const seen = new Map<string, SearchResultGroup>();
    for (const entry of results) {
      const cat = categoryMap.get(entry.id);
      const catId = cat?.id ?? "";
      let group = seen.get(catId);
      if (!group) {
        group = {
          categoryId: catId,
          categoryName: cat?.title ?? "",
          entries: [],
        };
        seen.set(catId, group);
        groups.push(group);
      }
      group.entries.push(entry);
    }
    return groups;
  }, [results, categoryMap]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    results,
    groupedResults,
    search,
    clearSearch,
    hasResults: results.length > 0,
    isSearching: query.length > 0,
  };
}
