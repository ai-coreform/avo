"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Separator } from "@avo/ui/components/ui/separator";
import { Slider } from "@avo/ui/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Undo2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useSyncExternalStore } from "react";
import { menusApi } from "@/api/menu";
import type { MenuListItem } from "@/api/menu/types";
import { menusQueryKeys } from "@/api/menu/use-get-menus";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { useUpdateVenue } from "@/api/venue/use-update-venue";
import {
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  LOGO_SIZE_STEP,
} from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_utils/menu-theme";
import { ImageUpload } from "@/components/image-upload";
import {
  useMenuDataPreviewSync,
  useThemePreviewSync,
} from "@/components/preview/menu-preview-iframe";
import { MenuPreviewPanel } from "@/components/preview/menu-preview-panel";
import { useLayout } from "@/providers/layout-provider";
import { PageActions } from "@/providers/page-header-provider";
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
  const { showPreview, togglePreview } = useLayout();
  const menus = data.menus;

  const queryClient = useQueryClient();
  const venueQuery = useGetVenue();
  const updateVenue = useUpdateVenue();
  const venueLogo = venueQuery.data?.logo ?? null;

  const handleLogoChange = useCallback(
    (url: string | null) => {
      updateVenue.mutate(
        { logo: url },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menusQueryKeys.all });
          },
        }
      );
    },
    [updateVenue, queryClient]
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    menus[0]?.slug ?? null
  );

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
      <PageActions>
        <Button
          disabled={!(isDirty && selectedMenu)}
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
      </PageActions>

      {/* Logo section */}
      <div className="max-w-3xl space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg">Logo</h3>
          <p className="text-muted-foreground text-sm">
            Il logo apparirà nell'intestazione del menu. Formati supportati:
            JPG, PNG, WebP, SVG (max 2 MB).
          </p>
        </div>
        <div className="flex items-center gap-6">
          <ImageUpload
            onChange={handleLogoChange}
            placeholder="Logo"
            shape="circle"
            sizeClassName="size-20"
            value={venueLogo}
          />
          {venueLogo && (
            <div className="flex-1 max-w-md space-y-2">
              <label className="font-medium text-sm">Dimensione Logo</label>
              <div className="flex items-center gap-3">
                <Slider
                  max={LOGO_SIZE_MAX}
                  min={LOGO_SIZE_MIN}
                  onValueChange={([val]) =>
                    updateTheme("logoSize", val ?? LOGO_SIZE_MIN)
                  }
                  step={LOGO_SIZE_STEP}
                  value={[theme.logoSize]}
                />
                <span className="w-12 shrink-0 text-muted-foreground text-sm">
                  {theme.logoSize}px
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Menu selector */}
      <MenuSelector
        menus={menus}
        onSelect={setSelectedSlug}
        selectedSlug={selectedSlug}
      />

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
        onClosePreview={togglePreview}
        showPreview
        venueSlug={venueSlug}
      >
        {settingsContent}
      </MenuPreviewPanel>
    );
  }

  return settingsContent;
}
