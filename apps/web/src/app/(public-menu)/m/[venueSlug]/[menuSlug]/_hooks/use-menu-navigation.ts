"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PublicMenuTab } from "@/api/public-menu/types";

interface UseMenuNavigationOptions {
  tabs: PublicMenuTab[];
  hasPromotions: boolean;
}

const PROMOS_TAB_SLUG = "promos";

/**
 * Update the URL search params without triggering a React/Next.js re-render.
 * `router.replace` goes through Next.js' router which can cause Suspense
 * boundaries to re-trigger and scroll containers to reset.
 * `history.replaceState` is purely cosmetic — it keeps the URL in sync for
 * sharing/bookmarking without any component remount.
 */
function updateUrl(tabSlug: string, categorySlug?: string) {
  const params = new URLSearchParams();
  params.set("tab", tabSlug);
  if (categorySlug) {
    params.set("category", categorySlug);
  }
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(window.history.state, "", url);
}

export function useMenuNavigation({
  tabs,
  hasPromotions,
}: UseMenuNavigationOptions) {
  const searchParams = useSearchParams();

  const initialTabSlug = hasPromotions
    ? PROMOS_TAB_SLUG
    : (tabs[0]?.slug ?? "");

  const [activeTabSlug, setActiveTabSlugState] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam === PROMOS_TAB_SLUG && hasPromotions) {
        return PROMOS_TAB_SLUG;
      }
      const found = tabs.find((t) => t.slug === tabParam);
      if (found) {
        return found.slug;
      }
    }
    return initialTabSlug;
  });

  const activeTab = tabs.find((t) => t.slug === activeTabSlug);
  const categories = activeTab?.categories ?? [];

  const [activeCategorySlug, setActiveCategorySlugState] = useState(() => {
    return searchParams.get("category") ?? categories[0]?.slug ?? "";
  });

  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);

  const setActiveTab = useCallback(
    (tabSlug: string) => {
      setActiveTabSlugState(tabSlug);
      const tab = tabs.find((t) => t.slug === tabSlug);
      const firstCategorySlug = tab?.categories[0]?.slug ?? "";
      setActiveCategorySlugState(firstCategorySlug);
      updateUrl(tabSlug, firstCategorySlug);
    },
    [tabs]
  );

  const setActiveCategory = useCallback(
    (slug: string) => {
      setActiveCategorySlugState(slug);
      updateUrl(activeTabSlug, slug);
    },
    [activeTabSlug]
  );

  // Sync category when tab changes and current category is invalid
  useEffect(() => {
    if (activeTabSlug === PROMOS_TAB_SLUG) {
      return;
    }
    if (categories.length > 0 && !activeCategory) {
      setActiveCategorySlugState(categories[0].slug);
    }
  }, [activeTabSlug, categories, activeCategory]);

  return {
    activeTabSlug,
    isPromosTab: activeTabSlug === PROMOS_TAB_SLUG,
    activeCategorySlug,
    activeCategory,
    categories,
    setActiveTab,
    setActiveCategory,
    PROMOS_TAB_SLUG,
  };
}
