"use client";

import { Button } from "@avo/ui/components/ui/button";
import { ChevronRight, Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { MenuEditorData } from "@/api/menu/types";
import { useGetMenuPreview } from "@/api/menu/use-get-menu-preview";
import { Main } from "@/components/layout/main";
import {
  useMenuDataPreviewSync,
  useTabPreviewSync,
} from "@/components/preview/menu-preview-iframe";
import { MenuPreviewPanel } from "@/components/preview/menu-preview-panel";
import { useLayout } from "@/providers/layout-provider";
import { PageTitle } from "@/providers/page-header-provider";
import { useCategoryDrag } from "../_hooks/use-category-drag";
import { useEditingRow } from "../_hooks/use-editing-row";
import { useEntrySelection } from "../_hooks/use-entry-selection";
import { useMenuEditor } from "../_hooks/use-menu-editor";
import { useXlBreakpoint } from "../_hooks/use-xl-breakpoint";
import { editorStateToPreviewData } from "../_utils/editor-to-preview";
import type {
  LocalMenuEditorCategory,
  LocalMenuEditorRow,
} from "../_utils/menu-editor-state";
import { MenuEditorActionBar } from "./menu-editor-action-bar";
import { MenuEditorCategories } from "./menu-editor-categories";
import { MenuEditorTabsBar, PROMOS_TAB_ID } from "./menu-editor-tabs-bar";
import { MenuEntrySelectionActionBar } from "./menu-entry-selection-action-bar";
import { MenuEntrySheet } from "./menu-entry-sheet";
import { MenuPromoEditor } from "./menu-promo-editor";
import { MenuTabsDialog } from "./menu-tabs-dialog";
import { MenuTitleSheet } from "./menu-title-sheet";
import { PendingEditsProvider } from "./pending-edits-context";
import { SharedCatalogDialog } from "./shared-catalog-dialog";

interface MenuEditorScreenProps {
  menuSlug: string;
  data: MenuEditorData;
  venueSlug: string | null;
  venueName: string | null;
  venueLogo: string | null;
}

export function MenuEditorScreen({
  menuSlug,
  data,
  venueSlug,
  venueName,
  venueLogo,
}: MenuEditorScreenProps) {
  const isXl = useXlBreakpoint();
  const { showPreview, togglePreview } = useLayout();
  const previewQuery = useGetMenuPreview(menuSlug, {
    enabled: isXl && showPreview && Boolean(venueSlug),
  });

  const editor = useMenuEditor({ menuSlug, initialData: data });

  const selection = useEntrySelection({
    activeTab: editor.activeTab,
    removeRow: editor.removeRow,
    updateEntryField: editor.updateEntryField,
  });

  const editing = useEditingRow({
    tabs: editor.state.tabs,
    updateCategory: editor.updateCategory,
    save: editor.save,
  });

  const categoryDrag = useCategoryDrag({
    tabLocalId: editor.activeTabLocalId,
    moveCategory: editor.moveCategory,
  });

  // Wrap updateCategory/updateRow to accept a patch object (used by table)
  const handleUpdateCategory = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      patch: Partial<LocalMenuEditorCategory>
    ) =>
      editor.updateCategory(tabLocalId, categoryLocalId, (categoryDraft) => {
        Object.assign(categoryDraft, patch);
      }),
    [editor.updateCategory]
  );

  const handleUpdateRow = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      rowLocalId: string,
      patch: Partial<LocalMenuEditorRow>
    ) =>
      editor.updateRow(tabLocalId, categoryLocalId, rowLocalId, (row) => {
        Object.assign(row, patch);
      }),
    [editor.updateRow]
  );

  // Track whether the promos tab is active
  const [activeView, setActiveView] = useState<string>(
    editor.activeTabLocalId ?? PROMOS_TAB_ID
  );
  const isPromosView = activeView === PROMOS_TAB_ID;

  // Clear selection when switching tabs
  const handleSetActiveTab = useCallback(
    (nextTabLocalId: string) => {
      selection.clearSelectedEntries();
      setActiveView(nextTabLocalId);
      if (nextTabLocalId !== PROMOS_TAB_ID) {
        editor.setActiveTabLocalId(nextTabLocalId);
      }
    },
    [selection.clearSelectedEntries, editor.setActiveTabLocalId]
  );

  // Preview sync
  const promotions = previewQuery.data?.menu.promotions;
  const previewData = useMemo(
    () =>
      venueSlug
        ? editorStateToPreviewData(
            editor.state,
            {
              name: venueName ?? data.menu.name,
              slug: venueSlug,
              logo: venueLogo,
              defaultLocale: "it",
            },
            promotions
          )
        : null,
    [editor.state, venueSlug, venueName, venueLogo, data.menu.name, promotions]
  );
  useMenuDataPreviewSync(previewData);

  // Sync active tab to preview iframe
  const previewTabSlug = useMemo(() => {
    if (activeView === PROMOS_TAB_ID) {
      return "promos";
    }
    const tab = editor.state.tabs.find((t) => t.localId === activeView);
    if (!tab) {
      return null;
    }
    return tab.slug || tab.label.toLowerCase().replace(/\s+/g, "-");
  }, [activeView, editor.state.tabs]);
  useTabPreviewSync(previewTabSlug);

  const canShowPreview = isXl && showPreview && venueSlug;

  const editorContent = (
    <PendingEditsProvider>
      <PageTitle>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
          <Link
            className="font-semibold text-lg text-muted-foreground hover:text-foreground"
            href="/menu"
          >
            Menu
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-lg">
            {editor.state.menu.name}
          </span>
        </div>
      </PageTitle>
      <Main className="flex flex-col gap-5" fixed fluid>
        <MenuEditorTabsBar
          activeTabLocalId={activeView}
          locales={data.locales ?? []}
          onAddTab={editor.addTab}
          onMoveTab={editor.moveTab}
          onRemoveTab={editor.removeTab}
          onSaveToServer={editor.save}
          onSelectTab={handleSetActiveTab}
          onUpdateTab={editor.updateTab}
          tabs={editor.state.tabs}
        />

        {isPromosView ? (
          <MenuPromoEditor locales={data.locales ?? []} menuSlug={menuSlug} />
        ) : (
          <>
            <MenuEditorCategories
              activeTab={editor.activeTab}
              activeTabLocalId={editor.activeTabLocalId}
              addCategory={editor.addCategory}
              addEntry={editor.addEntry}
              addExistingEntries={editor.addExistingEntries}
              addGroup={editor.addGroup}
              draftResetKey={editor.draftResetKey}
              draggedCategoryLocalId={categoryDrag.draggedCategoryLocalId}
              dragOverCategoryLocalId={categoryDrag.dragOverCategoryLocalId}
              getCategoryDragHandleProps={
                categoryDrag.getCategoryDragHandleProps
              }
              getCategoryDropZoneProps={categoryDrag.getCategoryDropZoneProps}
              locales={data.locales ?? []}
              moveRow={editor.moveRow}
              onToggleAllEntrySelections={selection.toggleAllEntrySelections}
              onToggleEntrySelection={selection.toggleEntrySelection}
              onUpdateCategory={handleUpdateCategory}
              onUpdateRow={handleUpdateRow}
              openRowSheet={editing.openRowSheet}
              removeCategory={editor.removeCategory}
              removeRow={editor.removeRow}
              saveToServer={editor.save}
              tabs={editor.state.tabs}
              tabsDialogAction={
                <MenuTabsDialog
                  activeTabLocalId={editor.activeTabLocalId}
                  locales={data.locales ?? []}
                  onAddTab={editor.addTab}
                  onMoveTab={editor.moveTab}
                  onRemoveTab={editor.removeTab}
                  onSaveToServer={editor.save}
                  onSelectTab={handleSetActiveTab}
                  onUpdateTab={editor.updateTab}
                  tabs={editor.state.tabs}
                  trigger={
                    <Button type="button">
                      <Plus />
                      Crea il primo tab
                    </Button>
                  }
                />
              }
              updateEntryField={editor.updateEntryField}
              visibleSelectedEntryIds={selection.visibleSelectedEntryIds}
            />

            {/* Entry detail sheet */}
            <MenuEntrySheet
              entry={editing.editingEntryContext?.entry ?? null}
              locales={data.locales ?? []}
              onOpenChange={(open) => {
                if (!open) {
                  editing.closeRowSheet();
                }
              }}
              onSave={editing.saveEntrySheet}
              open={Boolean(editing.editingEntryContext)}
            />

            {/* Group title sheet */}
            <MenuTitleSheet
              description="Modifica il nome del gruppo e le traduzioni disponibili."
              fallbackTitle="Nuovo gruppo"
              fieldLabel="Nome gruppo"
              fieldPlaceholder="es. Classici"
              locales={data.locales ?? []}
              onOpenChange={(open) => {
                if (!open) {
                  editing.closeRowSheet();
                }
              }}
              onSave={editing.saveGroupSheet}
              open={Boolean(editing.editingGroupContext)}
              value={
                editing.editingGroupContext
                  ? {
                      title: editing.editingGroupContext.group.title,
                      isVisible: editing.editingGroupContext.group.isVisible,
                      translations:
                        editing.editingGroupContext.group.translations,
                    }
                  : null
              }
            />

            {/* Bulk selection action bar */}
            <MenuEntrySelectionActionBar
              count={selection.selectedEntriesCount}
              onClear={selection.clearSelectedEntries}
              onDelete={selection.deleteSelectedEntries}
              onSetVisibility={selection.updateSelectedEntriesVisibility}
            />

            {/* Save/discard action bar */}
            <MenuEditorActionBar
              className={
                selection.selectedEntriesCount > 0 ? "bottom-24" : undefined
              }
              isSaving={editor.isSaving}
              onDiscard={editor.discardChanges}
              onSave={editor.save}
              visible={editor.hasUnsavedChanges}
            />
          </>
        )}
        <SharedCatalogDialog
          entries={editor.pendingSharedSave ?? []}
          onCancel={() => {
            editor.cancelSharedSave();
            editing.closeRowSheet();
          }}
          onConfirm={(strategy) => {
            editing.closeRowSheet();
            editor.confirmSharedSave(strategy);
          }}
          open={editor.pendingSharedSave !== null}
        />
      </Main>
    </PendingEditsProvider>
  );

  if (canShowPreview) {
    return (
      <MenuPreviewPanel
        menuSlug={menuSlug}
        onClosePreview={togglePreview}
        showPreview
        venueSlug={venueSlug}
      >
        {editorContent}
      </MenuPreviewPanel>
    );
  }

  return editorContent;
}
