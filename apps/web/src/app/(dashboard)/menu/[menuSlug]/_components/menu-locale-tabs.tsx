"use client";

import { Button } from "@avo/ui/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuEditorLocaleOption } from "../_utils/menu-translations";

interface MenuLocaleTabsProps {
  locales: MenuEditorLocaleOption[];
  activeLocale: string;
  onChange: (locale: string) => void;
  className?: string;
}

export function MenuLocaleTabs({
  locales,
  activeLocale,
  onChange,
  className,
}: MenuLocaleTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto px-6 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {locales.map((locale) => (
        <Button
          className={cn(
            "h-10 rounded-md px-3 font-medium text-sm shadow-none",
            activeLocale === locale.code
              ? "bg-primary text-primary-foreground hover:bg-primary/95"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          key={locale.code}
          onClick={() => onChange(locale.code)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <span>{locale.flag}</span>
          <span>{locale.label}</span>
          <span className="text-[11px] uppercase opacity-70">
            {locale.shortLabel}
          </span>
        </Button>
      ))}
    </div>
  );
}
