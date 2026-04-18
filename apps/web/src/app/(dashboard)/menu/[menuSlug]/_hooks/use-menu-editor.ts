"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { produce } from "immer";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CatalogItemListItem } from "@/api/catalog-items/types";
import type { MenuEditorData, UpdateMenuEditorInput } from "@/api/menu/types";
import { useUpdateMenuEditor } from "@/api/menu/use-update-menu-editor";
import {
  buildMenuEditorLocalState,
  buildMenuEditorPayload,
  cloneMenuEditorLocalState,
  createEmptyMenuEditorCategory,
  createEmptyMenuEditorEntryRow,
  createEmptyMenuEditorGroupRow,
  createEmptyMenuEditorTab,
  createMenuEditorEntryFromCatalogItem,
  getModifiedSharedEntries,
  type LocalMenuEditorCategory,
  type LocalMenuEditorEntryRow,
  type LocalMenuEditorRow,
  type LocalMenuEditorState,
  type ModifiedSharedEntry,
} from "../_utils/menu-editor-state";

interface UseMenuEditorParams {
  menuSlug: string;
  initialData: MenuEditorData;
}

function getDefaultActiveTabLocalId(state: LocalMenuEditorState) {
  return state.tabs[0]?.localId ?? null;
}

function resolveActiveTabLocalId(
  nextState: LocalMenuEditorState,
  previousState: LocalMenuEditorState,
  currentActiveTabLocalId: string | null
) {
  if (nextState.tabs.length === 0) {
    return null;
  }

  if (!currentActiveTabLocalId) {
    return getDefaultActiveTabLocalId(nextState);
  }

  const previousIndex = previousState.tabs.findIndex(
    (tab) => tab.localId === currentActiveTabLocalId
  );

  if (previousIndex < 0) {
    return getDefaultActiveTabLocalId(nextState);
  }

  const previousTab = previousState.tabs[previousIndex];

  if (previousTab?.id) {
    const persistedMatch = nextState.tabs.find(
      (tab) => tab.id === previousTab.id
    );

    if (persistedMatch) {
      return persistedMatch.localId;
    }
  }

  return (
    nextState.tabs[Math.min(previousIndex, nextState.tabs.length - 1)]
      ?.localId ?? getDefaultActiveTabLocalId(nextState)
  );
}

export function useMenuEditor({ menuSlug, initialData }: UseMenuEditorParams) {
  const initialState = useMemo(
    () => buildMenuEditorLocalState(initialData),
    [initialData]
  );
  const [state, setState] = useState(initialState);
  const [snapshot, setSnapshot] = useState(initialState);
  const [activeTabLocalId, setActiveTabLocalId] = useState<string | null>(
    getDefaultActiveTabLocalId(initialState)
  );
  const [draftResetKey, setDraftResetKey] = useState(0);
  const [pendingSharedSave, setPendingSharedSave] = useState<
    ModifiedSharedEntry[] | null
  >(null);
  const updateMenuEditor = useUpdateMenuEditor();
  const stateRef = useRef(state);
  const snapshotRef = useRef(snapshot);
  const activeTabLocalIdRef = useRef(activeTabLocalId);

  // Keep refs in sync without useEffect — assign eagerly on each render
  stateRef.current = state;
  snapshotRef.current = snapshot;
  activeTabLocalIdRef.current = activeTabLocalId;

  const currentPayload = useMemo(() => buildMenuEditorPayload(state), [state]);
  const snapshotPayload = useMemo(
    () => buildMenuEditorPayload(snapshot),
    [snapshot]
  );

  const hasUnsavedChanges =
    JSON.stringify(currentPayload) !== JSON.stringify(snapshotPayload);

  // Derive active tab — if the stored localId no longer exists, fall back
  const resolvedActiveTabLocalId = useMemo(() => {
    if (
      activeTabLocalId &&
      state.tabs.some((tab) => tab.localId === activeTabLocalId)
    ) {
      return activeTabLocalId;
    }

    return getDefaultActiveTabLocalId(state);
  }, [activeTabLocalId, state]);

  const activeTab =
    state.tabs.find((tab) => tab.localId === resolvedActiveTabLocalId) ?? null;

  const updateState = useCallback(
    (recipe: (draft: LocalMenuEditorState) => void) => {
      const nextState = produce(stateRef.current, recipe);
      stateRef.current = nextState;
      setState(nextState);
      return nextState;
    },
    []
  );

  const updateCategory = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      recipe: (category: LocalMenuEditorCategory) => void
    ) => {
      updateState((draft) => {
        const category = draft.tabs
          .find((tab) => tab.localId === tabLocalId)
          ?.categories.find((item) => item.localId === categoryLocalId);

        if (category) {
          recipe(category);
        }
      });
    },
    [updateState]
  );

  const updateRow = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      rowLocalId: string,
      recipe: (row: LocalMenuEditorRow) => void
    ) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        const row = category.rows.find((item) => item.localId === rowLocalId);
        if (row) {
          recipe(row);
        }
      });
    },
    [updateCategory]
  );

  const addTab = useCallback(() => {
    const nextTab = createEmptyMenuEditorTab();

    updateState((draft) => {
      draft.tabs.push(nextTab);
    });

    setActiveTabLocalId(nextTab.localId);
  }, [updateState]);

  const updateTab = useCallback(
    (
      tabLocalId: string,
      recipe: (tab: LocalMenuEditorState["tabs"][number]) => void
    ) => {
      updateState((draft) => {
        const tab = draft.tabs.find((item) => item.localId === tabLocalId);
        if (tab) {
          recipe(tab);
        }
      });
    },
    [updateState]
  );

  const moveTab = useCallback(
    (activeTabId: string, overTabId: string) => {
      updateState((draft) => {
        const activeIndex = draft.tabs.findIndex(
          (tab) => tab.localId === activeTabId
        );
        const overIndex = draft.tabs.findIndex(
          (tab) => tab.localId === overTabId
        );

        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return;
        }

        draft.tabs = arrayMove(draft.tabs, activeIndex, overIndex);
      });
    },
    [updateState]
  );

  const removeTab = useCallback(
    (tabLocalId: string) => {
      const previousState = stateRef.current;
      const nextState = updateState((draft) => {
        draft.tabs = draft.tabs.filter((tab) => tab.localId !== tabLocalId);
      });

      setActiveTabLocalId(
        resolveActiveTabLocalId(
          nextState,
          previousState,
          activeTabLocalIdRef.current
        )
      );
    },
    [updateState]
  );

  const addCategory = useCallback(
    (tabLocalId: string) => {
      updateState((draft) => {
        const tab = draft.tabs.find((item) => item.localId === tabLocalId);
        if (tab) {
          tab.categories.push(createEmptyMenuEditorCategory());
        }
      });
    },
    [updateState]
  );

  const moveCategory = useCallback(
    (
      tabLocalId: string,
      activeCategoryLocalId: string,
      overCategoryLocalId: string
    ) => {
      updateState((draft) => {
        const tab = draft.tabs.find((item) => item.localId === tabLocalId);

        if (!tab) {
          return;
        }

        const activeIndex = tab.categories.findIndex(
          (category) => category.localId === activeCategoryLocalId
        );
        const overIndex = tab.categories.findIndex(
          (category) => category.localId === overCategoryLocalId
        );

        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return;
        }

        tab.categories = arrayMove(tab.categories, activeIndex, overIndex);
      });
    },
    [updateState]
  );

  const removeCategory = useCallback(
    (tabLocalId: string, categoryLocalId: string) => {
      updateState((draft) => {
        const tab = draft.tabs.find((item) => item.localId === tabLocalId);
        if (tab) {
          tab.categories = tab.categories.filter(
            (category) => category.localId !== categoryLocalId
          );
        }
      });
    },
    [updateState]
  );

  const addEntry = useCallback(
    (tabLocalId: string, categoryLocalId: string) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        category.rows.push(createEmptyMenuEditorEntryRow());
      });
    },
    [updateCategory]
  );

  const addExistingEntries = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      items: CatalogItemListItem[]
    ) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        for (const item of items) {
          category.rows.push(createMenuEditorEntryFromCatalogItem(item));
        }
      });
    },
    [updateCategory]
  );

  const addGroup = useCallback(
    (tabLocalId: string, categoryLocalId: string) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        category.rows.push(createEmptyMenuEditorGroupRow());
      });
    },
    [updateCategory]
  );

  const removeRow = useCallback(
    (tabLocalId: string, categoryLocalId: string, rowLocalId: string) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        category.rows = category.rows.filter(
          (row) => row.localId !== rowLocalId
        );
      });
    },
    [updateCategory]
  );

  const updateEntryField = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      rowLocalId: string,
      patch: Partial<LocalMenuEditorEntryRow>
    ) => {
      updateRow(tabLocalId, categoryLocalId, rowLocalId, (row) => {
        if (row.kind === "entry") {
          Object.assign(row, patch);
        }
      });
    },
    [updateRow]
  );

  const moveRow = useCallback(
    (
      tabLocalId: string,
      categoryLocalId: string,
      activeRowLocalId: string,
      overRowLocalId: string
    ) => {
      updateCategory(tabLocalId, categoryLocalId, (category) => {
        const activeIndex = category.rows.findIndex(
          (row) => row.localId === activeRowLocalId
        );
        const overIndex = category.rows.findIndex(
          (row) => row.localId === overRowLocalId
        );

        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return;
        }

        category.rows = arrayMove(category.rows, activeIndex, overIndex);
      });
    },
    [updateCategory]
  );

  const executeSave = useCallback(
    async (
      sharedCatalogStrategy?: UpdateMenuEditorInput["sharedCatalogStrategy"]
    ) => {
      const previousState = stateRef.current;
      const payload = buildMenuEditorPayload(stateRef.current);

      if (sharedCatalogStrategy) {
        payload.sharedCatalogStrategy = sharedCatalogStrategy;
      }

      const request = updateMenuEditor.mutateAsync({
        menuSlug,
        data: payload,
      });

      await toast.promise(request, {
        loading: "Salvataggio menu in corso...",
        success: "Menu aggiornato correttamente",
        error: (error) =>
          error instanceof Error
            ? error.message
            : "Non siamo riusciti a salvare il menu. Riprova.",
      });

      const result = await request;

      const nextState = buildMenuEditorLocalState(result.data);
      const nextActiveTabLocalId = resolveActiveTabLocalId(
        nextState,
        previousState,
        activeTabLocalIdRef.current
      );

      stateRef.current = nextState;
      snapshotRef.current = nextState;
      setState(nextState);
      setSnapshot(nextState);
      setActiveTabLocalId(nextActiveTabLocalId);
      setDraftResetKey((current) => current + 1);
    },
    [menuSlug, updateMenuEditor]
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (typeof document !== "undefined") {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }

    await Promise.resolve();

    // Check if any shared catalog entries were modified
    const modifiedShared = getModifiedSharedEntries(
      stateRef.current,
      snapshotRef.current
    );
    if (modifiedShared.length > 0) {
      setPendingSharedSave(modifiedShared);
      return true;
    }

    await executeSave();
    return false;
  }, [executeSave]);

  const confirmSharedSave = useCallback(
    async (strategy: "global" | "local") => {
      setPendingSharedSave(null);
      await executeSave(strategy);
    },
    [executeSave]
  );

  const cancelSharedSave = useCallback(() => {
    setPendingSharedSave(null);
  }, []);

  const discardChanges = useCallback(() => {
    const previousState = stateRef.current;
    const nextState = cloneMenuEditorLocalState(snapshotRef.current);
    stateRef.current = nextState;
    setState(nextState);
    setActiveTabLocalId(
      resolveActiveTabLocalId(
        nextState,
        previousState,
        activeTabLocalIdRef.current
      )
    );
    setDraftResetKey((current) => current + 1);
  }, []);

  return {
    state,
    activeTab,
    activeTabLocalId: resolvedActiveTabLocalId,
    setActiveTabLocalId,
    hasUnsavedChanges,
    draftResetKey,
    isSaving: updateMenuEditor.isPending,
    addTab,
    updateTab,
    moveTab,
    removeTab,
    addCategory,
    moveCategory,
    updateCategory,
    removeCategory,
    addEntry,
    addExistingEntries,
    addGroup,
    removeRow,
    updateRow,
    updateEntryField,
    moveRow,
    save,
    discardChanges,
    pendingSharedSave,
    confirmSharedSave,
    cancelSharedSave,
  };
}
