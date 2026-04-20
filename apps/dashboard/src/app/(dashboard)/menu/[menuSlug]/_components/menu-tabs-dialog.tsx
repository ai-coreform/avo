"use client";

import { Button } from "@avo/ui/components/ui/button";
import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@avo/ui/components/ui/dialog";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  GripVertical,
  Languages,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LocalMenuEditorTab } from "../_utils/menu-editor-state";
import { EditableCell } from "./editable-cell";
import { MenuTitleSheet } from "./menu-title-sheet";

interface MenuTabsDialogProps {
  trigger?: ReactNode;
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
  onSaveToServer: () => Promise<boolean>;
}

const TAB_DRAG_MIME_TYPE = "application/x-avo-menu-tab";

export function MenuTabsDialog({
  trigger,
  tabs,
  activeTabLocalId,
  onSelectTab,
  onAddTab,
  onUpdateTab,
  onRemoveTab,
  onMoveTab,
  locales,
  onSaveToServer,
}: MenuTabsDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingTabLocalId, setEditingTabLocalId] = useState<string | null>(
    null
  );
  const [draggedTabLocalId, setDraggedTabLocalId] = useState<string | null>(
    null
  );
  const [dragOverTabLocalId, setDragOverTabLocalId] = useState<string | null>(
    null
  );

  const editingTab = useMemo(
    () =>
      editingTabLocalId
        ? (tabs.find((tab) => tab.localId === editingTabLocalId) ?? null)
        : null,
    [editingTabLocalId, tabs]
  );

  const columns = useMemo<ColumnDef<LocalMenuEditorTab>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => (
          <Button
            className="cursor-grab text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            data-no-row-click
            draggable
            onDragEnd={() => {
              setDraggedTabLocalId(null);
              setDragOverTabLocalId(null);
            }}
            onDragStart={(event) => {
              setDraggedTabLocalId(row.original.localId);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                TAB_DRAG_MIME_TYPE,
                row.original.localId
              );
              const tr = (event.target as HTMLElement).closest("tr");
              if (tr) {
                event.dataTransfer.setDragImage(tr, 0, tr.offsetHeight / 2);
              }
            }}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <GripVertical className="size-4" />
          </Button>
        ),
        size: 40,
      },
      {
        accessorKey: "label",
        header: () => (
          <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
            NOME
          </span>
        ),
        cell: ({ row }) => (
          <EditableCell
            className="font-medium"
            defaultValue={row.original.label}
            key={row.original.localId}
            onCommit={(value) =>
              onUpdateTab(row.original.localId, (tab) => {
                tab.label = value;
              })
            }
            placeholder="Nome tab"
          />
        ),
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              className="text-muted-foreground"
              data-no-row-click
              onClick={() => setEditingTabLocalId(row.original.localId)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Languages className="size-4" />
            </Button>
            <Button
              className="text-muted-foreground hover:text-destructive"
              data-no-row-click
              onClick={() => onRemoveTab(row.original.localId)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        size: 88,
      },
    ],
    [onRemoveTab, onUpdateTab]
  );

  const table = useReactTable({
    data: tabs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.localId,
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon-sm" type="button" variant="ghost">
            <PencilLine className="size-4" />
            <span className="sr-only">Modifica tab</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-4 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Gestisci tab</DialogTitle>
          <DialogDescription>
            Riordina le tab, rinominale e aggiungine di nuove. Le modifiche
            restano in bozza finché non salvi il menu.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <DataTable
            className="gap-0"
            containerClassName="rounded-t-md rounded-b-none border-border/70"
            getRowProps={(row) => ({
              className: cn(
                row.localId === activeTabLocalId && "bg-muted/30",
                draggedTabLocalId === row.localId && "opacity-50",
                dragOverTabLocalId === row.localId &&
                  "ring-2 ring-primary/15 ring-inset"
              ),
              onDragOver: (event) => {
                event.preventDefault();
                if (draggedTabLocalId && draggedTabLocalId !== row.localId) {
                  setDragOverTabLocalId(row.localId);
                }
              },
              onDrop: (event) => {
                event.preventDefault();
                const activeRowLocalId =
                  draggedTabLocalId ||
                  event.dataTransfer.getData(TAB_DRAG_MIME_TYPE);

                if (activeRowLocalId && activeRowLocalId !== row.localId) {
                  onMoveTab(activeRowLocalId, row.localId);
                }

                setDraggedTabLocalId(null);
                setDragOverTabLocalId(null);
              },
            })}
            onRowClick={(row) => onSelectTab(row.localId)}
            showPagination={false}
            table={table}
            tableCellClassName="px-3 py-[7px] align-middle"
            tableHeadClassName="h-9 bg-muted/60 px-3 py-2 text-muted-foreground"
          />
          <div className="rounded-b-md border-border/70 border-x border-b px-2 py-1">
            <Button
              className="font-light"
              onClick={onAddTab}
              type="button"
              variant="ghost"
            >
              <Plus className="size-4 stroke-1" />
              Nuova tab
            </Button>
          </div>
        </div>
      </DialogContent>
      <MenuTitleSheet
        description="Modifica il nome del tab e le traduzioni disponibili."
        fallbackTitle="Nuova tab"
        fieldLabel="Nome tab"
        fieldPlaceholder="es. Bevande"
        locales={locales}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingTabLocalId(null);
          }
        }}
        onSave={(values) => {
          if (!editingTabLocalId) {
            return;
          }

          onUpdateTab(editingTabLocalId, (tab) => {
            tab.label = values.title;
            tab.isVisible = values.isVisible;
            tab.translations = values.translations;
          });
          onSaveToServer();
        }}
        open={Boolean(editingTab)}
        value={
          editingTab
            ? {
                title: editingTab.label,
                isVisible: editingTab.isVisible,
                translations: editingTab.translations,
              }
            : null
        }
      />
    </Dialog>
  );
}
