"use client";

import { type DragEvent, useCallback, useState } from "react";

const CATEGORY_DRAG_MIME_TYPE = "application/x-avo-menu-category";

interface UseCategoryDragParams {
  tabLocalId: string | null;
  moveCategory: (
    tabLocalId: string,
    activeCategoryLocalId: string,
    overCategoryLocalId: string
  ) => void;
}

export function useCategoryDrag({
  tabLocalId,
  moveCategory,
}: UseCategoryDragParams) {
  const [draggedCategoryLocalId, setDraggedCategoryLocalId] = useState<
    string | null
  >(null);
  const [dragOverCategoryLocalId, setDragOverCategoryLocalId] = useState<
    string | null
  >(null);

  const getCategoryDragHandleProps = useCallback(
    (categoryLocalId: string) => ({
      draggable: true as const,
      onDragEnd: () => {
        setDraggedCategoryLocalId(null);
        setDragOverCategoryLocalId(null);
      },
      onDragStart: (event: DragEvent) => {
        setDraggedCategoryLocalId(categoryLocalId);
        event.dataTransfer.effectAllowed = "move" as const;
        event.dataTransfer.setData(CATEGORY_DRAG_MIME_TYPE, categoryLocalId);
      },
    }),
    []
  );

  const getCategoryDropZoneProps = useCallback(
    (categoryLocalId: string) => ({
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        if (
          draggedCategoryLocalId &&
          draggedCategoryLocalId !== categoryLocalId
        ) {
          setDragOverCategoryLocalId(categoryLocalId);
        }
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        const activeCategoryLocalId =
          draggedCategoryLocalId ||
          event.dataTransfer.getData(CATEGORY_DRAG_MIME_TYPE);

        if (
          tabLocalId &&
          activeCategoryLocalId &&
          activeCategoryLocalId !== categoryLocalId
        ) {
          moveCategory(tabLocalId, activeCategoryLocalId, categoryLocalId);
        }

        setDraggedCategoryLocalId(null);
        setDragOverCategoryLocalId(null);
      },
    }),
    [draggedCategoryLocalId, moveCategory, tabLocalId]
  );

  return {
    draggedCategoryLocalId,
    dragOverCategoryLocalId,
    getCategoryDragHandleProps,
    getCategoryDropZoneProps,
  };
}
