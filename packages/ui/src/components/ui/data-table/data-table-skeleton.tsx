import { cn } from "@avo/ui/lib/utils";
import { ScrollArea, ScrollBar } from "../scroll-area";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { DataTablePaginationSkeleton } from "./data-table-pagination-skeleton";

interface DataTableSkeletonProps extends React.ComponentProps<"div"> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  withViewOptions?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 20,
  filterCount = 2,
  withViewOptions = true,
  className,
  ...props
}: DataTableSkeletonProps) {
  return (
    <div className={cn("flex flex-1 flex-col space-y-4", className)} {...props}>
      <div className="flex w-full items-center justify-between gap-2 overflow-visible py-1">
        <div className="flex flex-1 items-center gap-2">
          {Array.from({ length: filterCount }).map((_, i) => (
            <Skeleton
              className="h-10 w-40 rounded-md lg:w-64"
              key={i.toString()}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {withViewOptions ? <Skeleton className="h-7 w-18" /> : null}
        </div>
      </div>

      <div className="relative flex flex-1">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
          <ScrollArea className="h-full w-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {Array.from({ length: 1 }).map((_, i) => (
                  <TableRow key={i.toString()}>
                    {Array.from({ length: columnCount }).map((___, j) => (
                      <TableHead key={j.toString()}>
                        <Skeleton className="h-6 w-full" />
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <TableRow className="hover:bg-transparent" key={i.toString()}>
                    {Array.from({ length: columnCount }).map((___, j) => (
                      <TableCell key={j.toString()}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePaginationSkeleton />
      </div>
    </div>
  );
}
