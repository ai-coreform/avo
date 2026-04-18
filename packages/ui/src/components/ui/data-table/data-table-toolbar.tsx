"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Input } from "@avo/ui/components/ui/input";
import { cn } from "@avo/ui/lib/utils";
import type { Column, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { type ComponentProps, useCallback, useMemo } from "react";
import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> extends ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );

  const onReset = useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className
      )}
      role="toolbar"
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter column={column} key={column.id} />
        ))}
        {isFiltered ? (
          <Button
            aria-label="Reset filters"
            className="border-dashed"
            onClick={onReset}
            size="sm"
            variant="outline"
          >
            <X />
            Reset
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {/* //@TODO */}
        {/* <DataTableViewOptions align="end" table={table} /> */}
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function renderToolbarFilter<TData>(
  column: Column<TData>,
  columnMeta: Column<TData>["columnDef"]["meta"]
) {
  if (!columnMeta?.variant) {
    return null;
  }

  switch (columnMeta.variant) {
    case "text":
      return (
        <Input
          className="h-8 max-w-[350px]"
          onChange={(event) => column.setFilterValue(event.target.value)}
          placeholder={columnMeta.placeholder ?? columnMeta.label}
          value={(column.getFilterValue() as string) ?? ""}
        />
      );

    case "number":
      return (
        <div className="relative">
          <Input
            className={cn("h-8 w-[120px]", columnMeta.unit ? "pr-8" : "")}
            inputMode="numeric"
            onChange={(event) => column.setFilterValue(event.target.value)}
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            type="number"
            value={(column.getFilterValue() as string) ?? ""}
          />
          {columnMeta.unit ? (
            <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
              {columnMeta.unit}
            </span>
          ) : null}
        </div>
      );

    // case "range":
    //   return (
    //     <DataTableSliderFilter
    //       column={column}
    //       title={columnMeta.label ?? column.id}
    //     />
    //   );

    case "date":
    case "dateRange":
      return (
        <DataTableDateFilter
          column={column}
          multiple={columnMeta.variant === "dateRange"}
          title={columnMeta.label ?? column.id}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          multiple={columnMeta.variant === "multiSelect"}
          options={columnMeta.options ?? []}
          title={columnMeta.label ?? column.id}
        />
      );

    default:
      return null;
  }
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  return renderToolbarFilter(column, column.columnDef.meta);
}
