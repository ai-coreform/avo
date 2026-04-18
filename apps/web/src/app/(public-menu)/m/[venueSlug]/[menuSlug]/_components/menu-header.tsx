"use client";

import { Search } from "lucide-react";
import { API_BASE_URL } from "@/config/environment";
import { LanguageSelector } from "./language-selector";

interface MenuHeaderProps {
  venueName: string;
  venueLogo?: string | null;
  locales: Array<{ locale: string; isEnabled: boolean }>;
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
  onSearchOpen: () => void;
}

function resolveLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) {
    return null;
  }
  if (logo.startsWith("http")) {
    return logo;
  }
  return `${API_BASE_URL}${logo}`;
}

export function MenuHeader({
  venueName,
  venueLogo,
  locales,
  currentLocale,
  onLocaleChange,
  onSearchOpen,
}: MenuHeaderProps) {
  const logoUrl = resolveLogoUrl(venueLogo);

  return (
    <div
      className="flex items-center justify-between px-4 pt-3 pb-1 sm:pb-3"
      style={{ backgroundColor: "var(--menu-header-bg)" }}
    >
      {/* Venue identity */}
      <div className="flex items-center gap-2.5">
        {logoUrl ? (
          // biome-ignore lint/performance/noImgElement: public menu uses dynamic URLs
          // biome-ignore lint/correctness/useImageSize: dimensions via CSS
          <img
            alt={venueName}
            className="max-h-[35px] object-cover"
            src={logoUrl}
          />
        ) : (
          <span
            className="font-display font-semibold text-lg"
            style={{ color: "var(--menu-text)" }}
          >
            {venueName}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          aria-label="Cerca nel menu"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
          onClick={onSearchOpen}
          style={{
            backgroundColor: "var(--menu-accent)",
            color: "var(--menu-text)",
          }}
          type="button"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        <LanguageSelector
          currentLocale={currentLocale}
          locales={locales}
          onLocaleChange={onLocaleChange}
        />
      </div>
    </div>
  );
}
