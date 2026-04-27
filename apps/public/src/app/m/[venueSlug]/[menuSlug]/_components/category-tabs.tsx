"use client";

import type { PublicMenuCategory } from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";

interface CategoryTabsProps {
  categories: PublicMenuCategory[];
  activeCategorySlug: string;
  onCategoryChange: (slug: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategorySlug,
  onCategoryChange,
}: CategoryTabsProps) {
  const t = useTranslation();

  if (categories.length <= 1) {
    return null;
  }

  return (
    <div className="scrollbar-hide overflow-x-auto">
      <div className="flex gap-2 px-4 py-3">
        {categories.map((category) => {
          const isActive = category.slug === activeCategorySlug;

          return (
            <button
              className="shrink-0 whitespace-nowrap rounded-sm px-4 py-2 font-medium font-sans text-sm transition-all"
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--menu-primary)",
                      color: "var(--menu-tab-active-text)",
                    }
                  : {
                      backgroundColor: "var(--menu-tab-bg)",
                      color: "var(--menu-tab-text)",
                      opacity: 0.6,
                    }
              }
              type="button"
            >
              {t(category.id, "title", category.title)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
