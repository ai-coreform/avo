import { Skeleton } from "../skeleton";

export function DataTablePaginationSkeleton() {
  return (
    <div className="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8">
      <Skeleton className="h-7 w-40 shrink-0" />
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-[4.5rem]" />
        </div>
        <div className="flex items-center justify-center font-medium text-sm">
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="hidden size-7 lg:block" />
          <Skeleton className="size-7" />
          <Skeleton className="size-7" />
          <Skeleton className="hidden size-7 lg:block" />
        </div>
      </div>
    </div>
  );
}
