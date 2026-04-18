"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@avo/ui/components/ui/tabs";
import { Eye, EyeOff, Star } from "lucide-react";
import type { LocalMenuEditorTab } from "../_utils/menu-editor-state";
import { MenuTabsDialog } from "./menu-tabs-dialog";

export const PROMOS_TAB_ID = "__promos__";

interface MenuEditorTabsBarProps {
  tabs: LocalMenuEditorTab[];
  activeTabLocalId: string | null;
  onSelectTab: (tabLocalId: string) => void;
  onAddTab: () => void;
  onUpdateTab: (
    tabLocalId: string,
    recipe: (tab: LocalMenuEditorTab) => void
  ) => void;
  onRemoveTab: (tabLocalId: string) => void;
  onMoveTab: (activeTabLocalId: string, overTabLocalId: string) => void;
  locales: string[];
  showPreviewToggle: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
  onSaveToServer: () => Promise<boolean>;
}

const HIDDEN_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function MenuEditorTabsBar({
  tabs,
  activeTabLocalId,
  onSelectTab,
  onAddTab,
  onUpdateTab,
  onRemoveTab,
  onMoveTab,
  locales,
  showPreviewToggle,
  showPreview,
  onTogglePreview,
  onSaveToServer,
}: MenuEditorTabsBarProps) {
  const tabsDialogProps = {
    activeTabLocalId,
    locales,
    onAddTab,
    onMoveTab,
    onRemoveTab,
    onSaveToServer,
    onSelectTab,
    onUpdateTab,
    tabs,
  };

  const tabTriggerClassName =
    "shrink-0 whitespace-nowrap px-4 font-display font-semibold text-muted-foreground text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-5";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`w-fit min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-none rounded-lg bg-muted ${HIDDEN_SCROLLBAR}`}
      >
        <Tabs
          onValueChange={onSelectTab}
          value={activeTabLocalId ?? PROMOS_TAB_ID}
        >
          <TabsList
            className="h-10 w-max border-none bg-transparent shadow-none"
            variant="default"
          >
            <TabsTrigger
              className={`${tabTriggerClassName} gap-1.5`}
              value={PROMOS_TAB_ID}
            >
              <Star className="size-3.5" />
              Promozioni
            </TabsTrigger>
            {tabs.map((tab) => (
              <TabsTrigger
                className={tabTriggerClassName}
                key={tab.localId}
                value={tab.localId}
              >
                {tab.label.trim() || "Nuova tab"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <MenuTabsDialog {...tabsDialogProps} />
      </div>

      {showPreviewToggle ? (
        <>
          <div className="flex-1" />
          <Button
            onClick={onTogglePreview}
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
        </>
      ) : null}
    </div>
  );
}
