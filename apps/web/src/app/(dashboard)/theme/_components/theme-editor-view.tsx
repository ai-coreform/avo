"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Separator } from "@avo/ui/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Save, Undo2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { menusApi } from "@/api/menu";
import type { MenuListItem } from "@/api/menu/types";
import { menusQueryKeys } from "@/api/menu/use-get-menus";
import {
  useMenuDataPreviewSync,
  useThemePreviewSync,
} from "@/components/preview/menu-preview-iframe";
import { MenuPreviewPanel } from "@/components/preview/menu-preview-panel";
import { useThemeEditor } from "../_hooks/use-theme-editor";
import { ColorSchemeSection } from "./color-scheme-section";
import { FontSection } from "./font-section";
import { MenuSelector } from "./menu-selector";
import { PresetPalettes } from "./preset-palettes";

const XL_BREAKPOINT = 1280;
const xlSubscribe = (cb: () => void) => {
  const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const xlSnapshot = () => window.innerWidth >= XL_BREAKPOINT;
const xlServerSnapshot = () => false;

export function ThemeEditorView({
  data,
}: {
  data: { menus: MenuListItem[]; venueSlug: string | null };
}) {
  const isXl = useSyncExternalStore(xlSubscribe, xlSnapshot, xlServerSnapshot);
  const menus = data.menus;

  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    menus[0]?.slug ?? null
  );
  const [showPreview, setShowPreview] = useState(true);

  const selectedMenu = menus.find((m) => m.slug === selectedSlug) ?? null;

  const {
    theme,
    isDirty,
    isSaving,
    updateTheme,
    applyPreset,
    handleReset,
    handleSave,
  } = useThemeEditor({ menu: selectedMenu });

  // Fetch menu preview data for the iframe
  const previewQuery = useQuery({
    queryKey: [...menusQueryKeys.detail(selectedMenu?.slug ?? ""), "preview"],
    queryFn: async () => {
      if (!selectedMenu) {
        throw new Error("No menu selected");
      }
      const response = await menusApi.getPreview(selectedMenu.slug);
      return response.data;
    },
    enabled: selectedMenu != null,
  });

  // Send theme + menu data to preview iframe
  useThemePreviewSync(theme);
  useMenuDataPreviewSync(previewQuery.data ?? null);

  const venueSlug = data.venueSlug;
  const canShowPreview = isXl && showPreview && selectedMenu && venueSlug;

  const settingsContent = (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      {/* Top bar: menu selector + actions */}
      <div className="flex items-center justify-between gap-4">
        <MenuSelector
          menus={menus}
          onSelect={setSelectedSlug}
          selectedSlug={selectedSlug}
        />

        <div className="flex items-center gap-2">
          {isXl && selectedMenu && data.venueSlug ? (
            <Button
              onClick={() => setShowPreview((prev) => !prev)}
              size="icon"
              title={showPreview ? "Nascondi anteprima" : "Mostra anteprima"}
              variant="outline"
            >
              {showPreview ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          ) : null}
          <Button
            disabled={!selectedMenu}
            onClick={handleReset}
            variant="outline"
          >
            <Undo2 className="size-4" />
            Ripristina
          </Button>
          <Button
            disabled={isSaving || !isDirty || !selectedMenu}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salva
          </Button>
        </div>
      </div>

      {selectedMenu ? (
        <div className="mt-5 max-w-3xl space-y-8">
          <PresetPalettes
            currentTheme={theme as unknown as Record<string, unknown>}
            onApplyPreset={applyPreset}
          />

          <Separator />

          <ColorSchemeSection onUpdateTheme={updateTheme} theme={theme} />

          <Separator />

          <FontSection onUpdateTheme={updateTheme} theme={theme} />

          <div className="pb-8" />
        </div>
      ) : (
        <p className="mt-5 text-muted-foreground text-sm">
          Seleziona un menu per personalizzare il tema.
        </p>
      )}
    </div>
  );

  if (canShowPreview) {
    return (
      <MenuPreviewPanel
        menuSlug={selectedMenu.slug}
        onClosePreview={() => setShowPreview(false)}
        showPreview
        venueSlug={venueSlug}
      >
        {settingsContent}
      </MenuPreviewPanel>
    );
  }

  return settingsContent;
}
