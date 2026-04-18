"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import { Checkbox } from "@avo/ui/components/ui/checkbox";
import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { PromoListItem, PromoSchedule } from "@/api/promos/types";
import { useGetPromos } from "@/api/promos/use-get-promos";
import { ImageCellUpload } from "@/components/image-cell-upload";
import { EmptyState } from "@/components/states/empty-state";
import { MenuEntryVisibilityBadge } from "./menu-entry-visibility-badge";
import { MenuPromoSheet } from "./menu-promo-sheet";

interface MenuPromoEditorProps {
  menuSlug: string;
  locales: string[];
}

const COLUMN_HEADER_CLASS =
  "text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none truncate";

function formatPrice(price: number) {
  return `${price.toFixed(2)}`;
}

const WEEKDAY_SHORT: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mer",
  thu: "Gio",
  fri: "Ven",
  sat: "Sab",
  sun: "Dom",
};

function formatScheduleLabel(schedules: PromoSchedule[]): string {
  if (schedules.length === 0) {
    return "Sempre";
  }
  const first = schedules[0];
  if (first.weekday !== null) {
    const days = schedules
      .filter(
        (s): s is PromoSchedule & { weekday: string } => s.weekday !== null
      )
      .map((s) => WEEKDAY_SHORT[s.weekday] ?? s.weekday)
      .join(", ");
    const time =
      first.startTime && first.endTime
        ? ` ${first.startTime.slice(0, 5)}–${first.endTime.slice(0, 5)}`
        : "";
    return `${days}${time}`;
  }
  if (first.startDate || first.endDate) {
    const from = first.startDate ?? "…";
    const to = first.endDate ?? "…";
    const time =
      first.startTime && first.endTime
        ? ` ${first.startTime.slice(0, 5)}–${first.endTime.slice(0, 5)}`
        : "";
    return `${from} → ${to}${time}`;
  }
  return "Sempre";
}

export function MenuPromoEditor({ menuSlug, locales }: MenuPromoEditorProps) {
  const { data: promos = [], isLoading } = useGetPromos(menuSlug);
  const [editingPromo, setEditingPromo] = useState<PromoListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function handleCreate() {
    setEditingPromo(null);
    setIsSheetOpen(true);
  }

  const handleEdit = useCallback((promo: PromoListItem) => {
    setEditingPromo(promo);
    setIsSheetOpen(true);
  }, []);

  function handleSheetClose() {
    setIsSheetOpen(false);
    setEditingPromo(null);
  }

  const columns = useMemo<ColumnDef<PromoListItem>[]>(
    () => [
      {
        id: "select",
        header: () => null,
        cell: () => <Checkbox />,
        size: 44,
      },
      {
        accessorKey: "isActive",
        header: () => <span className={COLUMN_HEADER_CLASS}>STATO</span>,
        cell: ({ row }) => (
          <MenuEntryVisibilityBadge
            isVisible={row.original.isActive}
            onToggle={() => {
              /* TODO */
            }}
          />
        ),
        size: 110,
      },
      {
        accessorKey: "title",
        header: () => <span className={COLUMN_HEADER_CLASS}>TITOLO</span>,
        size: 170,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.imageUrl ? (
              <ImageCellUpload
                onChange={() => {
                  /* TODO */
                }}
                value={row.original.imageUrl}
              />
            ) : null}
            <span className="truncate font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "shortDescription",
        header: () => <span className={COLUMN_HEADER_CLASS}>DESCRIZIONE</span>,
        cell: ({ row }) => (
          <span className="truncate text-sm">
            {row.original.shortDescription}
          </span>
        ),
      },
      {
        accessorKey: "promoPrice",
        header: () => <span className={COLUMN_HEADER_CLASS}>PREZZO</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 tabular-nums">
            <span className="text-sm">&euro;</span>
            {row.original.originalPrice !== null ? (
              <span className="text-muted-foreground text-sm line-through">
                {formatPrice(row.original.originalPrice)}
              </span>
            ) : null}
            <span className="font-medium text-sm">
              {formatPrice(row.original.promoPrice)}
            </span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "badgeLabel",
        header: () => <span className={COLUMN_HEADER_CLASS}>TAG</span>,
        cell: ({ row }) =>
          row.original.badgeLabel ? (
            <Badge variant="secondary">{row.original.badgeLabel}</Badge>
          ) : null,
        size: 110,
      },
      {
        id: "schedule",
        header: () => (
          <span className={COLUMN_HEADER_CLASS}>PROGRAMMAZIONE</span>
        ),
        cell: ({ row }) => (
          <span className="truncate text-muted-foreground text-sm">
            {formatScheduleLabel(row.original.schedules)}
          </span>
        ),
        size: 160,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              className="text-muted-foreground"
              onClick={() => handleEdit(row.original)}
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
    [handleEdit]
  );

  const table = useReactTable({
    data: promos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div className="h-16 animate-pulse rounded-xl bg-muted" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 className="font-bold font-display text-[15px] tracking-wide">
          Promozioni
        </h2>
        <span className="ml-auto font-sans text-[11px] text-muted-foreground tabular-nums">
          {promos.length} {promos.length === 1 ? "promo" : "promo"}
        </span>
      </div>

      {promos.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <DataTable
            className="gap-0"
            containerClassName="rounded-none border-0 [&_table]:table-fixed"
            getRowProps={(row) => ({
              className: "cursor-pointer",
              onClick: () => handleEdit(row),
            })}
            showPagination={false}
            table={table}
            tableCellClassName="border-r border-muted px-3 py-[7px] align-middle overflow-hidden last:border-r-0"
            tableHeadClassName="h-9 border-r border-border px-3 py-2 bg-muted/60 text-muted-foreground last:border-r-0"
          />
          <div className="flex border-muted border-t bg-muted/30">
            <button
              className="flex h-9 items-center gap-2 px-3 font-sans text-muted-foreground text-sm transition-colors hover:text-primary"
              onClick={handleCreate}
              type="button"
            >
              <Plus className="size-3.5" />
              <span>Nuova promo</span>
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          action={
            <Button onClick={handleCreate} type="button">
              <Plus />
              Crea la prima promozione
            </Button>
          }
          className="min-h-52 rounded-[24px]"
          description="Le promozioni vengono mostrate nel menu pubblico come offerte speciali."
          title="Nessuna promozione creata"
        />
      )}

      <MenuPromoSheet
        locales={locales}
        menuSlug={menuSlug}
        onOpenChange={(open) => {
          if (!open) {
            handleSheetClose();
          }
        }}
        open={isSheetOpen}
        promo={editingPromo}
      />
    </div>
  );
}
