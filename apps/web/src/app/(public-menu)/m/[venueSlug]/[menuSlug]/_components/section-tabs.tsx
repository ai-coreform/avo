"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PublicMenuTab } from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";

interface SectionTabsProps {
  tabs: PublicMenuTab[];
  hasPromotions: boolean;
  activeTabSlug: string;
  promosTabSlug: string;
  onTabChange: (tabSlug: string) => void;
}

export function SectionTabs({
  tabs,
  hasPromotions,
  activeTabSlug,
  promosTabSlug,
  onTabChange,
}: SectionTabsProps) {
  const t = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const allTabs = [
    ...(hasPromotions
      ? [{ id: promosTabSlug, slug: promosTabSlug, label: "Promos" }]
      : []),
    ...tabs.map((tab) => ({
      id: tab.id,
      slug: tab.slug,
      label: t(tab.id, "title", tab.label),
    })),
  ];

  const setTabRef = useCallback(
    (slug: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(slug, el);
      } else {
        tabRefs.current.delete(slug);
      }
    },
    []
  );

  // Scroll the active tab into view whenever it changes
  useEffect(() => {
    const el = tabRefs.current.get(activeTabSlug);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTabSlug]);

  return (
    <div
      className="scrollbar-hide flex overflow-x-auto border-b"
      ref={scrollRef}
      style={{ borderColor: "var(--menu-border)" }}
    >
      {allTabs.map((tab) => {
        const isActive = tab.slug === activeTabSlug;
        const isPromos = tab.slug === promosTabSlug;

        return (
          <button
            className="relative shrink-0 whitespace-nowrap px-4 py-3 font-bold font-display text-xl transition-all"
            key={tab.slug}
            onClick={() => onTabChange(tab.slug)}
            ref={setTabRef(tab.slug)}
            style={{
              color: "var(--menu-text)",
              opacity: isActive ? 1 : 0.4,
              ...(isPromos && isActive
                ? {
                    backgroundImage: "var(--menu-promo-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }
                : {}),
            }}
            type="button"
          >
            {tab.label}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 h-0.5 w-full rounded-full"
                style={{
                  backgroundColor: "var(--menu-primary)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
