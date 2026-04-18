import { cn } from "@avo/ui/lib/utils";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "../button";
import { Separator } from "../separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

interface DataTableActionBarProps<TData> {
  table?: Table<TData>;
  visible?: boolean;
  label?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  separatorClassName?: string;
  childrenClassName?: string;
}

export function DataTableActionBar<TData>({
  table,
  visible,
  label,
  children,
  className,
  labelClassName,
  separatorClassName,
  childrenClassName,
}: DataTableActionBarProps<TData>) {
  const selectedRowsCount = table
    ? table.getFilteredSelectedRowModel().rows.length
    : 0;
  const isVisible = visible ?? selectedRowsCount > 0;

  if (!isVisible) {
    return null;
  }

  const summaryLabel = label ?? `${selectedRowsCount} selezionati`;
  const canClearSelection = table && selectedRowsCount > 0;

  return (
    <div
      className={cn(
        "fade-in slide-in-from-bottom-5 fixed bottom-4 left-1/2 z-[60] flex w-fit -translate-x-1/2 animate-in items-center gap-2 rounded-md border bg-background px-4 py-2 shadow-2xl",
        className
      )}
    >
      <div
        className={cn(
          "flex h-7 items-center rounded-md border border-dashed pr-1 pl-2.5",
          labelClassName
        )}
      >
        <span className="whitespace-nowrap text-xs">{summaryLabel}</span>
        {canClearSelection ? (
          <>
            <Separator className="mr-1 ml-2" orientation="vertical" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="size-5 hover:border"
                  onClick={() => table.toggleAllRowsSelected(false)}
                  size="icon"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="size-3.5 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-4 border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                <p>Deseleziona</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
      <Separator
        className={cn("hidden h-5 sm:block", separatorClassName)}
        orientation="vertical"
      />
      <div className={cn("flex items-center gap-1.5", childrenClassName)}>
        {children}
      </div>
    </div>
  );
}
