"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import { Checkbox } from "@avo/ui/components/ui/checkbox";
import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  Eye,
  EyeOff,
  GripVertical,
  Library,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { type ButtonHTMLAttributes, memo, useMemo, useState } from "react";
import type { CatalogItemListItem } from "@/api/catalog-items/types";
import { ImageCellUpload } from "@/components/image-cell-upload";
import { cn } from "@/lib/utils";
import {
  countCategoryEntries,
  type LocalMenuEditorCategory,
  type LocalMenuEditorEntryRow,
  type LocalMenuEditorRow,
} from "../_utils/menu-editor-state";
import { CatalogItemPickerDialog } from "./catalog-item-picker-dialog";
import { EditableCell } from "./editable-cell";
import { MenuEntryVisibilityBadge } from "./menu-entry-visibility-badge";
import { MenuTitleSheet } from "./menu-title-sheet";

interface MenuCategoryTableProps {
  tabLocalId: string;
  category: LocalMenuEditorCategory;
  search: string;
  resetKey: number;
  onUpdateCategory: (
    tabLocalId: string,
    categoryLocalId: string,
    patch: Partial<LocalMenuEditorCategory>
  ) => void;
  onRemoveCategory: (tabLocalId: string, categoryLocalId: string) => void;
  onUpdateEntryField: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string,
    patch: Partial<LocalMenuEditorEntryRow>
  ) => void;
  onUpdateRow: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string,
    patch: Partial<LocalMenuEditorRow>
  ) => void;
  onAddEntry: (tabLocalId: string, categoryLocalId: string) => void;
  onAddExistingEntries: (
    tabLocalId: string,
    categoryLocalId: string,
    items: CatalogItemListItem[]
  ) => void;
  onAddGroup: (tabLocalId: string, categoryLocalId: string) => void;
  existingCatalogItemIds: Set<string>;
  onRemoveRow: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string
  ) => void;
  onOpenRowSheet: (
    tabLocalId: string,
    categoryLocalId: string,
    rowLocalId: string
  ) => void;
  onMoveRow: (
    tabLocalId: string,
    categoryLocalId: string,
    activeRowLocalId: string,
    overRowLocalId: string
  ) => void;
  selectedEntryIds: Set<string>;
  onToggleEntrySelection: (entryLocalId: string, nextSelected: boolean) => void;
  onToggleAllEntrySelections: (
    entryLocalIds: string[],
    nextSelected: boolean
  ) => void;
  categoryDragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  locales: string[];
  isCategoryDragged?: boolean;
  isCategoryDragOver?: boolean;
  onSaveToServer: () => Promise<boolean>;
}

function matchesSearch(row: LocalMenuEditorRow, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }

  if (row.kind === "group") {
    return row.title.toLowerCase().includes(term);
  }

  return [
    row.title,
    row.description,
    row.priceLabel,
    row.priceLabelOverride,
  ].some((value) => value.toLowerCase().includes(term));
}

function filterRows(rows: LocalMenuEditorRow[], search: string) {
  if (!search.trim()) {
    return rows;
  }

  const filteredRows: LocalMenuEditorRow[] = [];
  let currentGroup: Extract<LocalMenuEditorRow, { kind: "group" }> | null =
    null;
  let bufferedEntries: Extract<LocalMenuEditorRow, { kind: "entry" }>[] = [];

  function flushCurrentGroup() {
    if (!currentGroup) {
      return;
    }

    if (matchesSearch(currentGroup, search) || bufferedEntries.length > 0) {
      filteredRows.push(currentGroup, ...bufferedEntries);
    }

    currentGroup = null;
    bufferedEntries = [];
  }

  for (const row of rows) {
    if (row.kind === "group") {
      flushCurrentGroup();
      currentGroup = row;
      continue;
    }

    if (!currentGroup) {
      if (matchesSearch(row, search)) {
        filteredRows.push(row);
      }
      continue;
    }

    if (matchesSearch(row, search)) {
      bufferedEntries.push(row);
    }
  }

  flushCurrentGroup();

  return filteredRows;
}

const COLUMN_HEADER_CLASS =
  "text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none truncate";
const GHOST_ICON_BUTTON_CLASS = "text-muted-foreground";
const GROUP_ROW_CLASS =
  "bg-muted/30 hover:bg-muted/50 [&>td]:py-1.5 [&>td]:border-r-0";
const ROW_ACTIONS_CLASS = "flex items-center justify-end gap-1";

function MenuCategoryTableComponent({
  tabLocalId,
  category,
  search,
  resetKey,
  onUpdateCategory,
  onRemoveCategory,
  onUpdateEntryField,
  onUpdateRow,
  onAddEntry,
  onAddExistingEntries,
  onAddGroup,
  onRemoveRow: _onRemoveRow,
  onOpenRowSheet,
  onMoveRow,
  selectedEntryIds,
  onToggleEntrySelection,
  onToggleAllEntrySelections,
  locales,
  categoryDragHandleProps,
  isCategoryDragged = false,
  isCategoryDragOver = false,
  onSaveToServer,
  existingCatalogItemIds,
}: MenuCategoryTableProps) {
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => filterRows(category.rows, search),
    [category.rows, search]
  );
  // Stabilise the array reference so it only changes when entries are
  // added/removed, not when cell content is edited. This prevents the
  // `columns` useMemo (which depends on this value) from recreating column
  // definitions on every keystroke, which would cause TanStack Table to
  // rebuild cells and unmount/remount focused inputs.
  const entryIdsKey = category.rows
    .filter((row) => row.kind === "entry")
    .map((row) => row.localId)
    .join("\0");

  const categoryEntryLocalIds = useMemo(
    () => entryIdsKey.split("\0").filter(Boolean),
    [entryIdsKey]
  );
  const selectedCategoryEntriesCount = useMemo(
    () =>
      categoryEntryLocalIds.filter((entryLocalId) =>
        selectedEntryIds.has(entryLocalId)
      ).length,
    [categoryEntryLocalIds, selectedEntryIds]
  );
  const areAllCategoryEntriesSelected =
    categoryEntryLocalIds.length > 0 &&
    selectedCategoryEntriesCount === categoryEntryLocalIds.length;
  const isCategorySelectionIndeterminate =
    selectedCategoryEntriesCount > 0 && !areAllCategoryEntriesSelected;

  const columns = useMemo<ColumnDef<LocalMenuEditorRow>[]>(
    () => [
      {
        id: "drag-select",
        header: () =>
          categoryEntryLocalIds.length > 0 ? (
            <Checkbox
              checked={
                areAllCategoryEntriesSelected ||
                (isCategorySelectionIndeterminate && "indeterminate")
              }
              data-no-row-click
              onCheckedChange={(checked) =>
                onToggleAllEntrySelections(
                  categoryEntryLocalIds,
                  Boolean(checked)
                )
              }
            />
          ) : null,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              className={cn(
                GHOST_ICON_BUTTON_CLASS,
                "cursor-grab active:cursor-grabbing"
              )}
              data-no-row-click
              draggable
              onDragEnd={() => {
                setDraggedRowId(null);
                setDragOverRowId(null);
              }}
              onDragStart={(event) => {
                setDraggedRowId(row.original.localId);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", row.original.localId);
                const tr = (event.target as HTMLElement).closest("tr");
                if (tr) {
                  event.dataTransfer.setDragImage(tr, 0, tr.offsetHeight / 2);
                }
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <GripVertical className="size-4" />
            </Button>
            {row.original.kind === "entry" ? (
              <Checkbox
                checked={selectedEntryIds.has(row.original.localId)}
                data-no-row-click
                onCheckedChange={(checked) =>
                  onToggleEntrySelection(row.original.localId, Boolean(checked))
                }
              />
            ) : null}
          </div>
        ),
        size: 56,
      },
      {
        accessorKey: "isVisible",
        header: () => <span className={COLUMN_HEADER_CLASS}>STATO</span>,
        cell: ({ row }) => {
          if (row.original.kind === "group") {
            return null;
          }

          return (
            <MenuEntryVisibilityBadge
              isVisible={row.original.isVisible}
              onToggle={(nextVisible) =>
                onUpdateEntryField(
                  tabLocalId,
                  category.localId,
                  row.original.localId,
                  { isVisible: nextVisible }
                )
              }
            />
          );
        },
        size: 110,
      },
      {
        accessorKey: "title",
        size: 170,
        header: () => <span className={COLUMN_HEADER_CLASS}>NOME</span>,
        cell: ({ row }) => {
          if (row.original.kind === "group") {
            return (
              <div className="flex items-center gap-2">
                <EditableCell
                  className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]"
                  defaultValue={row.original.title}
                  key={`${resetKey}:${row.original.localId}:title`}
                  onCommit={(value) =>
                    onUpdateRow(
                      tabLocalId,
                      category.localId,
                      row.original.localId,
                      { title: value }
                    )
                  }
                />
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <ImageCellUpload
                onChange={(url) =>
                  onUpdateEntryField(
                    tabLocalId,
                    category.localId,
                    row.original.localId,
                    { imageUrl: url }
                  )
                }
                value={row.original.imageUrl}
              />
              <EditableCell
                className="font-medium"
                defaultValue={row.original.title}
                key={`${resetKey}:${row.original.localId}:title`}
                onCommit={(value) =>
                  onUpdateEntryField(
                    tabLocalId,
                    category.localId,
                    row.original.localId,
                    { title: value }
                  )
                }
                readOnly={false}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: () => <span className={COLUMN_HEADER_CLASS}>DESCRIZIONE</span>,
        cell: ({ row }) => {
          if (row.original.kind !== "entry") {
            return null;
          }

          return (
            <EditableCell
              defaultValue={row.original.description}
              key={`${resetKey}:${row.original.localId}:description`}
              onCommit={(value) =>
                onUpdateEntryField(
                  tabLocalId,
                  category.localId,
                  row.original.localId,
                  { description: value }
                )
              }
              placeholder="Aggiungi descrizione..."
            />
          );
        },
      },
      {
        accessorKey: "priceCents",
        header: () => <span className={COLUMN_HEADER_CLASS}>PREZZO</span>,
        cell: ({ row }) => {
          if (row.original.kind !== "entry") {
            return null;
          }

          return (
            <EditableCell
              className="tabular-nums"
              defaultValue={row.original.priceCents}
              inputMode="decimal"
              key={`${resetKey}:${row.original.localId}:priceCents`}
              onCommit={(value) =>
                onUpdateEntryField(
                  tabLocalId,
                  category.localId,
                  row.original.localId,
                  { priceCents: value }
                )
              }
              placeholder="0.00"
              prefix="€ "
            />
          );
        },
        size: 85,
      },
      {
        accessorKey: "priceLabel",
        header: () => <span className={COLUMN_HEADER_CLASS}>ETICHETTA</span>,
        cell: ({ row }) => {
          if (row.original.kind !== "entry") {
            return null;
          }

          return (
            <EditableCell
              defaultValue={row.original.priceLabel}
              key={`${resetKey}:${row.original.localId}:priceLabel`}
              onCommit={(value) =>
                onUpdateEntryField(
                  tabLocalId,
                  category.localId,
                  row.original.localId,
                  { priceLabel: value }
                )
              }
              placeholder="/hg, cad..."
            />
          );
        },
        size: 90,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className={ROW_ACTIONS_CLASS}>
            <Button
              className={GHOST_ICON_BUTTON_CLASS}
              data-no-row-click
              onClick={() =>
                onOpenRowSheet(
                  tabLocalId,
                  category.localId,
                  row.original.localId
                )
              }
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        ),
        size: 44,
      },
    ],
    [
      areAllCategoryEntriesSelected,
      category.localId,
      categoryEntryLocalIds,
      isCategorySelectionIndeterminate,
      onOpenRowSheet,
      onToggleAllEntrySelections,
      onToggleEntrySelection,
      onUpdateEntryField,
      onUpdateRow,
      resetKey,
      selectedEntryIds,
      tabLocalId,
    ]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.localId,
  });

  return (
    <div
      className={cn(
        "transition-all",
        isCategoryDragged && "opacity-55",
        isCategoryDragOver && "rounded-md ring-2 ring-primary/10"
      )}
    >
      {/* Category header */}
      <div className="mb-1.5 flex items-center gap-2.5">
        <button
          {...categoryDragHandleProps}
          className="-ml-1 cursor-grab active:cursor-grabbing"
          type="button"
        >
          <GripVertical className="size-4 text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
        </button>

        <h2 className="font-bold font-display text-[15px] tracking-wide">
          {category.title}
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              type="button"
            >
              <EllipsisVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => setIsCategorySheetOpen(true)}
            >
              <Pencil className="size-3.5" />
              Modifica
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() =>
                onUpdateCategory(tabLocalId, category.localId, {
                  isVisible: !category.isVisible,
                })
              }
            >
              {category.isVisible ? (
                <>
                  <EyeOff className="size-3.5" />
                  Nascondi
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  Mostra
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onSelect={() => onRemoveCategory(tabLocalId, category.localId)}
            >
              <Trash2 className="size-3.5" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!category.isVisible && (
          <Badge
            className="border-0 bg-muted py-0 text-[10px] text-muted-foreground"
            variant="secondary"
          >
            Nascosta
          </Badge>
        )}

        <span className="ml-auto font-sans text-[11px] text-muted-foreground tabular-nums">
          {countCategoryEntries(category)}{" "}
          {countCategoryEntries(category) === 1 ? "voce" : "voci"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <DataTable
          className="gap-0"
          containerClassName="rounded-none border-0 [&_table]:table-fixed"
          getRowProps={(row) => ({
            className: cn(
              row.kind === "group" && GROUP_ROW_CLASS,
              draggedRowId === row.localId && "opacity-50",
              dragOverRowId === row.localId &&
                "ring-2 ring-primary/15 ring-inset"
            ),
            onDragOver: (event) => {
              event.preventDefault();
              if (draggedRowId && draggedRowId !== row.localId) {
                setDragOverRowId(row.localId);
              }
            },
            onDrop: (event) => {
              event.preventDefault();
              const activeRowLocalId =
                draggedRowId || event.dataTransfer.getData("text/plain");

              if (activeRowLocalId && activeRowLocalId !== row.localId) {
                onMoveRow(
                  tabLocalId,
                  category.localId,
                  activeRowLocalId,
                  row.localId
                );
              }

              setDraggedRowId(null);
              setDragOverRowId(null);
            },
          })}
          showPagination={false}
          table={table}
          tableCellClassName="border-r border-muted px-3 py-[7px] align-middle overflow-hidden last:border-r-0"
          tableHeadClassName="h-9 border-r border-border px-3 py-2 bg-muted/60 text-muted-foreground last:border-r-0"
        />
        <div className="flex border-muted border-t bg-muted/30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-9 items-center gap-2 px-3 font-sans text-muted-foreground text-sm transition-colors hover:text-primary"
                type="button"
              >
                <Plus className="size-3.5" />
                <span>Aggiungi voce</span>
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => onAddEntry(tabLocalId, category.localId)}
              >
                <Plus className="size-4" />
                Nuova voce
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCatalogPickerOpen(true)}>
                <Library className="size-4" />
                Da catalogo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="flex h-9 items-center gap-2 px-3 font-sans text-muted-foreground text-sm transition-colors hover:text-primary"
            onClick={() => onAddGroup(tabLocalId, category.localId)}
            type="button"
          >
            <Plus className="size-3.5" />
            <span>Nuovo gruppo</span>
          </button>
        </div>
        <CatalogItemPickerDialog
          existingCatalogItemIds={existingCatalogItemIds}
          onOpenChange={setIsCatalogPickerOpen}
          onSelect={(items) =>
            onAddExistingEntries(tabLocalId, category.localId, items)
          }
          open={isCatalogPickerOpen}
        />
      </div>

      <MenuTitleSheet
        description="Modifica il nome della categoria e le traduzioni disponibili."
        fallbackTitle="Nuova categoria"
        fieldLabel="Nome categoria"
        fieldPlaceholder="es. Antipasti"
        locales={locales}
        onOpenChange={setIsCategorySheetOpen}
        onSave={(values) => {
          onUpdateCategory(tabLocalId, category.localId, {
            title: values.title,
            isVisible: values.isVisible,
            translations: values.translations,
          });
          onSaveToServer();
        }}
        open={isCategorySheetOpen}
        value={category}
      />
    </div>
  );
}

function areMenuCategoryTablePropsEqual(
  previousProps: MenuCategoryTableProps,
  nextProps: MenuCategoryTableProps
) {
  return (
    previousProps.tabLocalId === nextProps.tabLocalId &&
    previousProps.category === nextProps.category &&
    previousProps.search === nextProps.search &&
    previousProps.resetKey === nextProps.resetKey &&
    previousProps.selectedEntryIds === nextProps.selectedEntryIds &&
    previousProps.isCategoryDragged === nextProps.isCategoryDragged &&
    previousProps.isCategoryDragOver === nextProps.isCategoryDragOver &&
    previousProps.locales === nextProps.locales
  );
}

export const MenuCategoryTable = memo(
  MenuCategoryTableComponent,
  areMenuCategoryTablePropsEqual
);
