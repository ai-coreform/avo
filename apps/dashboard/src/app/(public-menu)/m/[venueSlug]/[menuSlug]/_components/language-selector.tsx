"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  it: "Italiano",
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  ro: "Română",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
};

const LOCALE_FLAGS: Record<string, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  fr: "🇫🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  pt: "🇵🇹",
  nl: "🇳🇱",
  pl: "🇵🇱",
  ro: "🇷🇴",
  ru: "🇷🇺",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  ar: "🇸🇦",
};

interface LanguageSelectorProps {
  locales: Array<{ locale: string; isEnabled: boolean }>;
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}

export function LanguageSelector({
  locales,
  currentLocale,
  onLocaleChange,
}: LanguageSelectorProps) {
  if (locales.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors hover:opacity-80"
          style={{
            backgroundColor: "var(--menu-accent)",
            color: "var(--menu-text)",
          }}
          type="button"
        >
          <span className="text-sm">{LOCALE_FLAGS[currentLocale] ?? "🌐"}</span>
          <span className="font-medium font-sans text-sm uppercase">
            {currentLocale}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            className={l.locale === currentLocale ? "font-bold" : ""}
            key={l.locale}
            onClick={() => onLocaleChange(l.locale)}
          >
            <span className="mr-2">{LOCALE_FLAGS[l.locale] ?? "🌐"}</span>
            {LOCALE_LABELS[l.locale] ?? l.locale.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
