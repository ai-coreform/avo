"use client";

import { useCallback, useState } from "react";
import { useGetTranslations } from "@/api/public-menu/use-get-translations";

interface UseMenuLocaleOptions {
  venueSlug: string;
  menuSlug: string;
  defaultLocale: string;
  locales: Array<{ locale: string; isEnabled: boolean }>;
}

export function useMenuLocale({
  venueSlug,
  menuSlug,
  defaultLocale,
  locales,
}: UseMenuLocaleOptions) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }
    const stored = localStorage.getItem(`avo-menu-locale-${venueSlug}`);
    if (stored && locales.some((l) => l.locale === stored)) {
      return stored;
    }
    return defaultLocale;
  });

  const translationsQuery = useGetTranslations(
    venueSlug,
    menuSlug,
    locale,
    defaultLocale
  );

  const setLocale = useCallback(
    (newLocale: string) => {
      setLocaleState(newLocale);
      localStorage.setItem(`avo-menu-locale-${venueSlug}`, newLocale);
    },
    [venueSlug]
  );

  const t = useCallback(
    (entityId: string, field: string, fallback: string): string => {
      if (locale === defaultLocale) {
        return fallback;
      }
      const translations = translationsQuery.data?.translations;
      if (!translations) {
        return fallback;
      }
      return translations[entityId]?.[field] ?? fallback;
    },
    [locale, defaultLocale, translationsQuery.data]
  );

  return {
    locale,
    setLocale,
    t,
    isDefaultLocale: locale === defaultLocale,
    isLoadingTranslations: translationsQuery.isLoading,
  };
}
