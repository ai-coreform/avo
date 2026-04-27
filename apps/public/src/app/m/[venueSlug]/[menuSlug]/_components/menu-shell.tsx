"use client";

import type { MenuTheme } from "@avo/menu/menu-theme";
import {
  FONT_OPTIONS,
  getFontFamily,
  resolveTheme,
  themeToCSS,
} from "@avo/menu/menu-theme";
import type { AiWaiterPreviewSettings } from "@avo/menu/preview-protocol";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicMenuData } from "@/api/public-menu/types";
import { useHeaderHeight } from "../_hooks/use-header-height";
import { useMenuLocale } from "../_hooks/use-menu-locale";
import { useMenuNavigation } from "../_hooks/use-menu-navigation";
import { useMenuSearch } from "../_hooks/use-menu-search";
import { MenuThemeProvider } from "../_hooks/use-menu-theme";
import { TranslationProvider } from "../_hooks/use-translation-context";
import { isPromotionVisible } from "../_utils/promo-schedule-filter";
import { AvoChatFab } from "./avo-chat-fab";
import { AvoChatPanel } from "./avo-chat-panel";
import { CategoryTabs } from "./category-tabs";
import { MenuHeader } from "./menu-header";
import { MenuItemList } from "./menu-item-list";
import { MenuSearchDialog } from "./menu-search-dialog";
import { PromotionsGrid } from "./promotions-grid";
import { SectionTabs } from "./section-tabs";

interface MenuShellProps {
  data: PublicMenuData;
  themeOverride?: Partial<MenuTheme> | null;
  tabSlugOverride?: string | null;
  chatOpenOverride?: boolean | null;
  aiSettingsOverride?: AiWaiterPreviewSettings | null;
}

export function MenuShell({
  data,
  themeOverride,
  tabSlugOverride,
  chatOpenOverride,
  aiSettingsOverride,
}: MenuShellProps) {
  const baseTheme = useMemo(
    () => resolveTheme(data.menu.theme as Partial<MenuTheme>),
    [data.menu.theme]
  );
  const theme = useMemo(
    () => (themeOverride ? { ...baseTheme, ...themeOverride } : baseTheme),
    [baseTheme, themeOverride]
  );
  const cssVars = useMemo(() => themeToCSS(theme), [theme]);

  const { locale, setLocale, t } = useMenuLocale({
    venueSlug: data.venue.slug,
    menuSlug: data.menu.slug,
    defaultLocale: data.venue.defaultLocale,
    locales: data.venue.locales,
  });

  const checkHasVisiblePromos = useCallback(
    () => data.menu.promotions.some((p) => isPromotionVisible(p)),
    [data.menu.promotions]
  );
  const [hasPromotions, setHasPromotions] = useState(checkHasVisiblePromos);

  useEffect(() => {
    setHasPromotions(checkHasVisiblePromos());
    const interval = setInterval(
      () => setHasPromotions(checkHasVisiblePromos()),
      60_000
    );
    return () => clearInterval(interval);
  }, [checkHasVisiblePromos]);

  const nav = useMenuNavigation({
    tabs: data.menu.tabs,
    hasPromotions,
  });

  // Sync tab from parent editor (non-binding: editor changes push here,
  // but the preview can still navigate independently)
  const navRef = useRef(nav);
  navRef.current = nav;
  useEffect(() => {
    if (tabSlugOverride && tabSlugOverride !== navRef.current.activeTabSlug) {
      navRef.current.setActiveTab(tabSlugOverride);
    }
  }, [tabSlugOverride]);

  const search = useMenuSearch(data.menu.tabs);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(chatOpenOverride === true);
  const { headerRef, headerHeight } = useHeaderHeight();

  // In preview mode the dashboard can force the chat panel open/closed so
  // admins on the AI Waiter settings page see the chat without clicking.
  useEffect(() => {
    if (chatOpenOverride !== null && chatOpenOverride !== undefined) {
      setChatOpen(chatOpenOverride);
    }
  }, [chatOpenOverride]);

  // Google Fonts links
  const fontLinks = useMemo(() => {
    const links: string[] = [];
    for (const font of FONT_OPTIONS) {
      if (font.value === theme.fontDisplay || font.value === theme.fontBody) {
        links.push(font.url);
      }
    }
    return links;
  }, [theme.fontDisplay, theme.fontBody]);

  return (
    <TranslationProvider t={t}>
      <MenuThemeProvider value={theme}>
        {/* Google Fonts */}
        {fontLinks.map((url) => (
          <link href={url} key={url} rel="stylesheet" />
        ))}

        {/* Font override style */}
        <style>{`
        [data-menu] .font-display { font-family: ${getFontFamily(theme.fontDisplay)} !important; }
        [data-menu] .font-sans { font-family: ${getFontFamily(theme.fontBody)} !important; }
        [data-menu] .dotted-leader {
          flex: 1;
          border-bottom: 2px dotted var(--menu-border, var(--menu-accent));
          margin: 0 8px;
          min-width: 20px;
          align-self: baseline;
          margin-bottom: 4px;
        }
        [data-menu] .scrollbar-hide::-webkit-scrollbar { display: none; }
        [data-menu] .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        [data-menu] { -ms-overflow-style: none; scrollbar-width: none; }
        [data-menu]::-webkit-scrollbar { display: none; }
        html:has([data-menu]) { -ms-overflow-style: none; scrollbar-width: none; }
        html:has([data-menu])::-webkit-scrollbar { display: none; }
      `}</style>

        <div
          className="mx-auto min-h-screen w-full max-w-md lg:max-w-6xl xl:max-w-7xl"
          data-menu
          style={{
            ...cssVars,
            backgroundColor: "var(--menu-bg)",
            color: "var(--menu-text)",
          }}
        >
          {/* Fixed header */}
          <div
            className="fixed top-0 right-0 left-0 z-30 mx-auto max-w-md border-b lg:max-w-6xl xl:max-w-7xl"
            ref={headerRef}
            style={{
              borderColor: "var(--menu-border)",
              backgroundColor: "var(--menu-header-bg)",
            }}
          >
            <MenuHeader
              currentLocale={locale}
              locales={data.venue.locales}
              onLocaleChange={setLocale}
              onSearchOpen={() => setSearchOpen(true)}
              venueLogo={data.venue.logo}
              venueName={data.venue.name}
            />
            <SectionTabs
              activeTabSlug={nav.activeTabSlug}
              hasPromotions={hasPromotions}
              onTabChange={nav.setActiveTab}
              promosTabSlug={nav.PROMOS_TAB_SLUG}
              tabs={data.menu.tabs}
            />
            {!nav.isPromosTab && (
              <CategoryTabs
                activeCategorySlug={nav.activeCategorySlug}
                categories={nav.categories}
                onCategoryChange={nav.setActiveCategory}
              />
            )}
          </div>

          {/* Content with header offset */}
          <div style={{ paddingTop: headerHeight }}>
            {nav.isPromosTab && (
              <PromotionsGrid promotions={data.menu.promotions} />
            )}
            {!nav.isPromosTab && nav.activeCategory && (
              <div className="px-4 pb-8">
                <MenuItemList entries={nav.activeCategory.entries} />
              </div>
            )}
            {!(nav.isPromosTab || nav.activeCategory) && (
              <div className="flex items-center justify-center py-16">
                <p
                  className="font-sans text-sm"
                  style={{ color: "var(--menu-text)", opacity: 0.5 }}
                >
                  Seleziona una categoria
                </p>
              </div>
            )}
          </div>

          {/* Search overlay */}
          <MenuSearchDialog
            groupedResults={search.groupedResults}
            isOpen={searchOpen}
            onClose={() => {
              setSearchOpen(false);
              search.clearSearch();
            }}
            onSearch={search.search}
            query={search.query}
            totalResults={search.results.length}
          />

          {/* AVO Chat — resolution order: live-preview override > saved
              venue.aiSettings > component default. Personality is *only*
              piped from preview override (not from venue API) because the
              chat backend reads it from the venue row directly; sending it
              from here would add nothing and only matters for live preview. */}
          {!chatOpen && (
            <AvoChatFab
              bgColor={
                aiSettingsOverride?.bgColor ?? data.venue.aiSettings?.bgColor
              }
              onClick={() => setChatOpen(true)}
            />
          )}
          {chatOpen && (
            <AvoChatPanel
              bgColor={
                aiSettingsOverride?.bgColor ?? data.venue.aiSettings?.bgColor
              }
              locale={locale}
              menuSlug={data.menu.slug}
              onClose={() => setChatOpen(false)}
              personality={aiSettingsOverride?.personality}
              venueSlug={data.venue.slug}
              welcomeSuggestions={
                aiSettingsOverride?.questions ??
                data.venue.aiSettings?.questions
              }
            />
          )}
        </div>
      </MenuThemeProvider>
    </TranslationProvider>
  );
}
