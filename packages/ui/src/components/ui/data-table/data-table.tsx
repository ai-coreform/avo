import { getCommonPinningStyles } from "@avo/ui/lib/data-table";
import { cn } from "@avo/ui/lib/utils";
import {
  flexRender,
  type Row as TanstackRow,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import type * as React from "react";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTablePaginationSkeleton } from "./data-table-pagination-skeleton";

interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The table instance returned from useDataTable hook with pagination, sorting, filtering, etc.
   * @type TanstackTable<TData>
   */
  table: TanstackTable<TData>;

  /**
   * The floating bar to render at the bottom of the table on row selection.
   * @default null
   * @type React.ReactNode | null
   * @example floatingBar={<TasksTableFloatingBar table={table} />}
   */
  floatingBar?: React.ReactNode | null;

  /**
   * The class name to apply to the table header.
   * @default ''
   * @type string
   */
  tableHeadClassName?: string;

  /**
   * The class name to apply to the table cells.
   * @default ''
   * @type string
   */
  tableCellClassName?: string;

  /**
   * The class name to apply to the table container.
   * @default ''
   * @type string
   */
  containerClassName?: string;

  /**
   * Whether to show the pagination controls.
   * @default true
   * @type boolean
   */
  showPagination?: boolean;

  /**
   * Whether the table is in a loading state. When true, displays skeleton loaders.
   * @default false
   * @type boolean
   */
  isLoading?: boolean;

  /**
   * Optional click handler for each row. When provided, rows become clickable
   * with a stronger hover state and keyboard accessibility.
   */
  onRowClick?: (row: TData, tanstackRow: TanstackRow<TData>) => void;

  /**
   * Optional per-row props used for advanced behaviors such as drag-and-drop.
   */
  getRowProps?: (
    row: TData,
    tanstackRow: TanstackRow<TData>
  ) => React.HTMLAttributes<HTMLTableRowElement>;

  /**
   * Optional ref to the scroll container for infinite scroll support.
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function DataTable<TData>({
  table,
  floatingBar = null,
  children,
  tableHeadClassName,
  tableCellClassName,
  containerClassName,
  showPagination = true,
  isLoading = false,
  onRowClick,
  getRowProps,
  scrollContainerRef,
  className,
  ...props
}: DataTableProps<TData>) {
  function isFromInteractiveElement(
    event: React.MouseEvent | React.KeyboardEvent
  ): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }
    const interactive = target.closest(
      'a, button, input, textarea, select, label, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [contenteditable=""], [contenteditable="true"], [data-no-row-click]'
    );
    return Boolean(interactive);
  }

  function renderTableBody() {
    if (isLoading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <TableRow className="hover:bg-transparent" key={i.toString()}>
          {Array.from({ length: table.getAllColumns().length }).map(
            (___, j) => (
              <TableCell className={tableCellClassName} key={j.toString()}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            )
          )}
        </TableRow>
      ));
    }

    const rows = table.getRowModel().rows;
    if (!rows?.length) {
      return (
        <TableRow>
          <TableCell
            className={cn("h-24 text-center", tableCellClassName)}
            colSpan={table.getAllColumns().length}
          >
            Nessun risultato.
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => {
      const rowProps = getRowProps?.(row.original, row) ?? {};
      const {
        className: rowClassName,
        style: rowStyle,
        ...restRowProps
      } = rowProps;
      const handleRowClick = onRowClick
        ? (event: React.MouseEvent) => {
            if (isFromInteractiveElement(event)) {
              return;
            }
            onRowClick(row.original, row);
          }
        : undefined;

      return (
        <TableRow
          className={cn(
            "",
            Boolean(onRowClick) && "cursor-pointer",
            rowClassName
          )}
          data-state={row.getIsSelected() && "selected"}
          key={row.id}
          onClick={handleRowClick}
          onKeyDown={(event) => {
            if (!onRowClick) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              if (isFromInteractiveElement(event)) {
                return;
              }
              event.preventDefault();
              onRowClick(row.original, row);
            }
          }}
          style={rowStyle}
          {...(onRowClick ? { tabIndex: 0 } : {})}
          {...restRowProps}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              className={tableCellClassName}
              key={cell.id}
              style={{
                ...getCommonPinningStyles({
                  column: cell.column,
                }),
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      );
    });
  }

  function renderTableHeader() {
    if (isLoading) {
      return (
        <TableRow>
          {Array.from({ length: table.getAllColumns().length }).map((_, j) => (
            <TableHead
              className={cn("bg-secondary!", tableHeadClassName)}
              key={j.toString()}
            >
              <Skeleton className="h-6 w-full" />
            </TableHead>
          ))}
        </TableRow>
      );
    }

    return table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead
            className={cn("bg-primary/5!", tableHeadClassName)}
            colSpan={header.colSpan}
            key={header.id}
            style={{
              width:
                header.column.columnDef.size != null
                  ? header.column.getSize()
                  : undefined,
              ...getCommonPinningStyles({
                column: header.column,
              }),
            }}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ));
  }

  return (
    <div
      className={cn("flex flex-1 flex-col gap-4 overflow-hidden", className)}
      {...props}
    >
      {children}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-md border",
          containerClassName
        )}
      >
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {renderTableHeader()}
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </div>
      </div>
      {showPagination === true &&
        (isLoading === true ? (
          <DataTablePaginationSkeleton />
        ) : (
          <>
            <DataTablePagination table={table} />
            {table.getFilteredSelectedRowModel().rows.length > 0 && floatingBar}
          </>
        ))}
    </div>
  );
}
