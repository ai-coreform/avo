import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
} from "@avo/ui/components/ui/select";
import { cn } from "@avo/ui/lib/utils";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import type { HTMLAttributes } from "react";

function getTitle(isAscSorted: boolean, isDescSorted: boolean) {
  if (isDescSorted) {
    return "Sorted descending. Click to sort ascending.";
  }
  if (isAscSorted) {
    return "Sorted ascending. Click to sort descending.";
  }
  return "Not sorted. Click to sort ascending.";
}

function getIcon(isAscSorted: boolean, isDescSorted: boolean) {
  if (isDescSorted) {
    return <ArrowDown aria-hidden="true" className="ml-2.5 size-4" />;
  }
  if (isAscSorted) {
    return <ArrowUp aria-hidden="true" className="ml-2.5 size-4" />;
  }
  return <ChevronsUpDown aria-hidden="true" className="ml-2.5 size-4" />;
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!(column.getCanSort() || column.getCanHide())) {
    return <div className={cn(className)}>{title}</div>;
  }

  const ascValue = `${column.id}-asc`;
  const descValue = `${column.id}-desc`;
  const hideValue = `${column.id}-hide`;
  const isAscSorted = column.getIsSorted() === "asc";
  const isDescSorted = column.getIsSorted() === "desc";

  let selectValue: string | undefined = isDescSorted ? descValue : undefined;

  if (isAscSorted) {
    selectValue = ascValue;
  }

  return (
    <div className={cn("flex items-center gap-2 whitespace-nowrap", className)}>
      <Select
        onValueChange={(value) => {
          if (value === ascValue) {
            column.toggleSorting(false);
          } else if (value === descValue) {
            column.toggleSorting(true);
          } else if (value === hideValue) {
            column.toggleVisibility(false);
          }
        }}
        value={selectValue}
      >
        <SelectTrigger
          aria-label={getTitle(isAscSorted, isDescSorted)}
          className="-ml-3 h-8 w-fit border-none bg-transparent text-md text-primary shadow-none outline-none ring-0! hover:text-accent-foreground data-placeholder:text-muted-foreground [&>svg:last-child]:hidden"
        >
          {title}
          <SelectIcon asChild>
            {column.getCanSort() && getIcon(isAscSorted, isDescSorted)}
          </SelectIcon>
        </SelectTrigger>
        <SelectContent align="start">
          {column.getCanSort() && (
            <>
              <SelectItem value={ascValue}>
                <span className="flex items-center">
                  <ArrowUp
                    aria-hidden="true"
                    className="mr-2 size-3.5 text-muted-foreground/70"
                  />
                  Asc
                </span>
              </SelectItem>
              <SelectItem value={descValue}>
                <span className="flex items-center">
                  <ArrowDown
                    aria-hidden="true"
                    className="mr-2 size-3.5 text-muted-foreground/70"
                  />
                  Desc
                </span>
              </SelectItem>
            </>
          )}
          {column.getCanHide() && (
            <SelectItem value={hideValue}>
              <span className="flex items-center">
                <EyeOff
                  aria-hidden="true"
                  className="mr-2 size-3.5 text-muted-foreground/70"
                />
                Hide
              </span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
