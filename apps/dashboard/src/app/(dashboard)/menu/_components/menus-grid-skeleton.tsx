import { Skeleton } from "@avo/ui/components/ui/skeleton";

export function MenusGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="overflow-hidden rounded-2xl border border-border/60"
          key={`menu-skeleton-${index + 1}`}
        >
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
