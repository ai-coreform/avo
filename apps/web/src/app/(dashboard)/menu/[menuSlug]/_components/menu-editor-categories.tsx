"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Plus } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import type { CatalogItemListItem } from "@/api/catalog-items/types";
import { EmptyState } from "@/components/states/empty-state";
import type {
  LocalMenuEditorCategory,
  LocalMenuEditorEntryRow,
  LocalMenuEditorRow,
  LocalMenuEditorTab,
} from "../_utils/menu-editor-state";
import { MenuCategoryTable } from "./menu-category-table";

interface MenuEditorCategoriesProps {
  activeTab: LocalMenuEditorTab | null;
  activeTabLocalId: string | null;
  tabs: LocalMenuEditorTab[];
  draftResetKey: number;
  // Category drag
  draggedCategoryLocalId: string | null;
  dragOverCategoryLocalId: string | null;
  getCategoryDragHandleProps: (
    categoryLocalId: string
  ) => Record<string, unknown>;
  getCategoryDropZoneProps: (
    categoryLocalId: string
  ) => Record<string, unknown>;
  // Entry selection
  visibleSelectedEntryIds: Set<string>;
  onToggleEntrySelection: (entryLocalId: string, nextSelected: boolean) => void;
  onToggleAllEntrySelections: (
    entryLocalIds: string[],
    nextSelected: boolean
  ) => void;
  // Editor actions
  addCategory: (tabLocalId: string) => void;
  onUpdateCategory: (
    tabLocalId: string,
    categoryLocalId: string,
    patch: Partial<LocalMenuEditorCategory>
  ) => void;
  removeCategory: (tabLocalId: string, categoryLocalId: string) => void;
  addEntry: (tabLocalId: string, categoryLocalId: string) => void;
  addExistingEntries: (
    tabLocalId: string,
    categoryLocalId: string,
    items: CatalogItemListItem[]
  ) => void;
  addGroup: (tabLocalId: string, categoryLocalId: string) => void;
  removeRow: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string
  ) => void;
  onUpdateRow: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string,
    patch: Partial<LocalMenuEditorRow>
  ) => void;
  updateEntryField: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string,
    patch: Partial<LocalMenuEditorEntryRow>
  ) => void;
  moveRow: (
    tabLocalId: string,
    categoryLocalId: string,
    activeRowLocalId: string,
    overRowLocalId: string
  ) => void;
  openRowSheet: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string
  ) => void;
  // Tabs dialog (for the empty state)
  tabsDialogAction: ReactNode;
  // Dynamic locales
  locales: string[];
  // Persist to server immediately (used by sheet saves)
  saveToServer: () => Promise<boolean>;
}

export function MenuEditorCategories({
  activeTab,
  tabs,
  draftResetKey,
  draggedCategoryLocalId,
  dragOverCategoryLocalId,
  getCategoryDragHandleProps,
  getCategoryDropZoneProps,
  visibleSelectedEntryIds,
  onToggleEntrySelection,
  onToggleAllEntrySelections,
  addCategory,
  onUpdateCategory,
  removeCategory,
  addEntry,
  addExistingEntries,
  addGroup,
  removeRow,
  onUpdateRow,
  updateEntryField,
  moveRow,
  openRowSheet,
  tabsDialogAction,
  locales,
  saveToServer,
}: MenuEditorCategoriesProps) {
  const existingCatalogItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const tab of tabs) {
      for (const category of tab.categories) {
        for (const row of category.rows) {
          if (row.kind === "entry" && row.catalogItemId) {
            ids.add(row.catalogItemId);
          }
        }
      }
    }
    return ids;
  }, [tabs]);
  if (!activeTab) {
    return (
      <EmptyState
        action={tabsDialogAction}
        className="min-h-56 rounded-[24px]"
        description="I tab sono sezioni libere del menu. Puoi nominarli come vuoi, riordinarli e gestirli dall'icona di modifica."
        title="Nessuna tab creato"
      />
    );
  }

  const categories = activeTab.categories;

  return (
    <div className="space-y-4">
      {categories.length > 0 ? (
        categories.map((category) => (
          <div
            key={category.localId}
            {...getCategoryDropZoneProps(category.localId)}
          >
            <MenuCategoryTable
              category={category}
              categoryDragHandleProps={getCategoryDragHandleProps(
                category.localId
              )}
              existingCatalogItemIds={existingCatalogItemIds}
              isCategoryDragged={draggedCategoryLocalId === category.localId}
              isCategoryDragOver={dragOverCategoryLocalId === category.localId}
              locales={locales}
              onAddEntry={addEntry}
              onAddExistingEntries={addExistingEntries}
              onAddGroup={addGroup}
              onMoveRow={moveRow}
              onOpenRowSheet={openRowSheet}
              onRemoveCategory={removeCategory}
              onRemoveRow={removeRow}
              onSaveToServer={saveToServer}
              onToggleAllEntrySelections={onToggleAllEntrySelections}
              onToggleEntrySelection={onToggleEntrySelection}
              onUpdateCategory={onUpdateCategory}
              onUpdateEntryField={updateEntryField}
              onUpdateRow={onUpdateRow}
              resetKey={draftResetKey}
              search=""
              selectedEntryIds={visibleSelectedEntryIds}
              tabLocalId={activeTab.localId}
            />
          </div>
        ))
      ) : (
        <EmptyState
          action={
            <Button
              onClick={() => addCategory(activeTab.localId)}
              type="button"
            >
              <Plus />
              Crea la prima categoria
            </Button>
          }
          className="min-h-52 rounded-[24px]"
          description={`Aggiungi una categoria al tab ${activeTab.label.trim() || "senza nome"}.`}
          title="Nessuna categoria in questo tab"
        />
      )}

      {categories.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 border-t border-dashed" />
          <Button
            className="rounded-full px-4"
            onClick={() => addCategory(activeTab.localId)}
            type="button"
            variant="outline"
          >
            <Plus />
            Nuova categoria
          </Button>
          <div className="h-px flex-1 border-t border-dashed" />
        </div>
      ) : null}
    </div>
  );
}
