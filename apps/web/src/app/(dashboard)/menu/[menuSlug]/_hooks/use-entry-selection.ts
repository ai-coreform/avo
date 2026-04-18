"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  LocalMenuEditorEntryRow,
  LocalMenuEditorTab,
} from "../_utils/menu-editor-state";

interface SelectedMenuEntry {
  categoryLocalId: string;
  rowLocalId: string;
  row: LocalMenuEditorEntryRow;
}

interface UseEntrySelectionParams {
  activeTab: LocalMenuEditorTab | null;
  removeRow: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string
  ) => void;
  updateEntryField: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string,
    patch: Partial<LocalMenuEditorEntryRow>
  ) => void;
}

export function useEntrySelection({
  activeTab,
  removeRow,
  updateEntryField,
}: UseEntrySelectionParams) {
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    () => new Set()
  );

  const selectedEntries = useMemo<SelectedMenuEntry[]>(() => {
    if (!activeTab) {
      return [];
    }

    const entries: SelectedMenuEntry[] = [];

    for (const category of activeTab.categories) {
      for (const row of category.rows) {
        if (row.kind === "entry" && selectedEntryIds.has(row.localId)) {
          entries.push({
            categoryLocalId: category.localId,
            rowLocalId: row.localId,
            row,
          });
        }
      }
    }

    return entries;
  }, [activeTab, selectedEntryIds]);

  // Stabilise the Set reference so it only changes when the actual IDs
  // change, not when activeTab gets a new Immer reference.  Without this
  // the Set would be recreated on every editor state change, which causes
  // MenuCategoryTable's `columns` useMemo to recreate column definitions
  // (selectedEntryIds is a dep) → TanStack Table unmounts/remounts cells
  // → focused inputs lose focus.
  const visibleSelectedEntryIdsKey = selectedEntries
    .map((entry) => entry.rowLocalId)
    .sort()
    .join("\0");

  const visibleSelectedEntryIds = useMemo(
    () => new Set(visibleSelectedEntryIdsKey.split("\0").filter(Boolean)),
    [visibleSelectedEntryIdsKey]
  );

  const clearSelectedEntries = useCallback(
    () => setSelectedEntryIds(new Set()),
    []
  );

  const toggleEntrySelection = useCallback(
    (entryLocalId: string, nextSelected: boolean) => {
      setSelectedEntryIds((current) => {
        const next = new Set(current);
        if (nextSelected) {
          next.add(entryLocalId);
        } else {
          next.delete(entryLocalId);
        }
        return next;
      });
    },
    []
  );

  const toggleAllEntrySelections = useCallback(
    (entryLocalIds: string[], nextSelected: boolean) => {
      setSelectedEntryIds((current) => {
        const next = new Set(current);
        for (const entryLocalId of entryLocalIds) {
          if (nextSelected) {
            next.add(entryLocalId);
          } else {
            next.delete(entryLocalId);
          }
        }
        return next;
      });
    },
    []
  );

  const deleteSelectedEntries = useCallback(() => {
    if (!activeTab) {
      return;
    }

    for (const entry of selectedEntries) {
      removeRow(activeTab.localId, entry.categoryLocalId, entry.rowLocalId);
    }

    clearSelectedEntries();
  }, [activeTab, clearSelectedEntries, removeRow, selectedEntries]);

  const updateSelectedEntriesVisibility = useCallback(
    (nextVisible: boolean) => {
      if (!activeTab) {
        return;
      }

      for (const entry of selectedEntries) {
        updateEntryField(
          activeTab.localId,
          entry.categoryLocalId,
          entry.rowLocalId,
          { isVisible: nextVisible }
        );
      }

      clearSelectedEntries();
    },
    [activeTab, clearSelectedEntries, selectedEntries, updateEntryField]
  );

  return {
    selectedEntriesCount: selectedEntries.length,
    visibleSelectedEntryIds,
    clearSelectedEntries,
    toggleEntrySelection,
    toggleAllEntrySelections,
    deleteSelectedEntries,
    updateSelectedEntriesVisibility,
  };
}
