"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  LocalMenuEditorCategory,
  LocalMenuEditorEntryRow,
  LocalMenuEditorGroupRow,
  LocalMenuEditorState,
} from "../_utils/menu-editor-state";
import type { MenuEntrySheetSubmitValues } from "../_utils/menu-entry-sheet-schema";

interface EditingRowPointer {
  tabLocalId: string;
  categoryLocalId: string;
  rowLocalId: string;
}

interface EditingEntryContext {
  tabLocalId: string;
  categoryLocalId: string;
  entry: LocalMenuEditorEntryRow;
}

interface EditingGroupContext {
  tabLocalId: string;
  categoryLocalId: string;
  group: LocalMenuEditorGroupRow;
}

interface UseEditingRowParams {
  tabs: LocalMenuEditorState["tabs"];
  updateCategory: (
    tabLocalId: string,
    categoryLocalId: string,
    recipe: (category: LocalMenuEditorCategory) => void
  ) => void;
  save: () => Promise<boolean>;
}

export function useEditingRow({
  tabs,
  updateCategory,
  save,
}: UseEditingRowParams) {
  const [editingRow, setEditingRow] = useState<EditingRowPointer | null>(null);

  const editingRowContext = useMemo(() => {
    if (!editingRow) {
      return null;
    }

    const tab = tabs.find((item) => item.localId === editingRow.tabLocalId);
    if (!tab) {
      return null;
    }

    const category = tab.categories.find(
      (item) => item.localId === editingRow.categoryLocalId
    );
    if (!category) {
      return null;
    }

    const row = category.rows.find(
      (item) => item.localId === editingRow.rowLocalId
    );
    if (!row) {
      return null;
    }

    return { tabLocalId: tab.localId, categoryLocalId: category.localId, row };
  }, [editingRow, tabs]);

  const editingEntryContext = useMemo<EditingEntryContext | null>(() => {
    if (!editingRowContext || editingRowContext.row.kind !== "entry") {
      return null;
    }
    return { ...editingRowContext, entry: editingRowContext.row };
  }, [editingRowContext]);

  const editingGroupContext = useMemo<EditingGroupContext | null>(() => {
    if (!editingRowContext || editingRowContext.row.kind !== "group") {
      return null;
    }
    return { ...editingRowContext, group: editingRowContext.row };
  }, [editingRowContext]);

  const openRowSheet = useCallback(
    (tabLocalId: string, categoryLocalId: string, rowLocalId: string) => {
      setEditingRow({ tabLocalId, categoryLocalId, rowLocalId });
    },
    []
  );

  const closeRowSheet = useCallback(() => {
    setEditingRow(null);
  }, []);

  const saveEntrySheet = useCallback(
    async (values: MenuEntrySheetSubmitValues) => {
      const context = editingEntryContext;
      if (!context) {
        return;
      }

      updateCategory(
        context.tabLocalId,
        context.categoryLocalId,
        (categoryDraft) => {
          const row = categoryDraft.rows.find(
            (item): item is LocalMenuEditorEntryRow =>
              item.kind === "entry" && item.localId === context.entry.localId
          );

          if (!row) {
            return;
          }

          row.title = values.title;
          row.description = values.description;
          row.priceCents = values.priceCents;
          row.priceLabel = values.priceLabel;
          row.isVisible = values.isVisible;
          row.allergens = values.allergens;
          row.features = values.features;
          row.additives = values.additives;
          row.imageUrl = values.imageUrl ?? null;
          row.translations = values.translations;
        }
      );

      const dialogShown = await save();
      if (!dialogShown) {
        setEditingRow(null);
      }
    },
    [editingEntryContext, updateCategory, save]
  );

  const saveGroupSheet = useCallback(
    async (values: {
      title: string;
      isVisible: boolean;
      translations: LocalMenuEditorGroupRow["translations"];
    }) => {
      const context = editingGroupContext;
      if (!context) {
        return;
      }

      updateCategory(
        context.tabLocalId,
        context.categoryLocalId,
        (categoryDraft) => {
          const row = categoryDraft.rows.find(
            (item): item is LocalMenuEditorGroupRow =>
              item.kind === "group" && item.localId === context.group.localId
          );

          if (!row) {
            return;
          }

          row.title = values.title;
          row.isVisible = values.isVisible;
          row.translations = values.translations;
        }
      );

      const dialogShown = await save();
      if (!dialogShown) {
        setEditingRow(null);
      }
    },
    [editingGroupContext, updateCategory, save]
  );

  return {
    editingEntryContext,
    editingGroupContext,
    openRowSheet,
    closeRowSheet,
    saveEntrySheet,
    saveGroupSheet,
  };
}
