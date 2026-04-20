import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { Main } from "@/components/layout/main";
import { EmptyState } from "@/components/states/empty-state";
import { QueryErrorState } from "@/components/states/query-error-state";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-muted border-b px-3 py-[7px]">
      {/* drag + checkbox */}
      <div className="flex shrink-0 items-center gap-1">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="size-4 rounded-sm" />
      </div>
      {/* status badge */}
      <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      {/* image + name */}
      <div className="flex shrink-0 items-center gap-2" style={{ width: 170 }}>
        <Skeleton className="size-9 shrink-0 rounded" />
        <Skeleton className="h-4 flex-1" />
      </div>
      {/* description (flex) */}
      <Skeleton className="h-4 flex-[1]" />
      {/* price */}
      <Skeleton className="h-4 w-[85px] shrink-0" />
      {/* price label */}
      <Skeleton className="h-4 w-[90px] shrink-0" />
      {/* actions arrow */}
      <Skeleton className="size-4 shrink-0" />
    </div>
  );
}

function SkeletonCategory({ rows = 4 }: { rows?: number }) {
  return (
    <div>
      {/* Flat category header */}
      <div className="mb-1.5 flex items-center gap-2.5">
        <Skeleton className="size-4 shrink-0 rounded-sm" />
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="size-4 shrink-0 rounded-sm" />
        <Skeleton className="ml-auto h-3.5 w-12 rounded" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {/* Column header row */}
        <div className="flex items-center gap-3 border-border border-b bg-muted/60 px-3 py-2">
          <Skeleton className="size-3.5 shrink-0 rounded-sm" />
          <Skeleton className="h-3 w-10 shrink-0" />
          <Skeleton className="h-3 w-12 shrink-0" />
          <Skeleton className="h-3 flex-[1]" />
          <Skeleton className="h-3 w-[85px] shrink-0" />
          <Skeleton className="h-3 w-[90px] shrink-0" />
          <div className="w-4 shrink-0" />
        </div>

        {/* Data rows */}
        {Array.from({ length: rows }, (_, i) => `row-${i}`).map((id) => (
          <SkeletonRow key={id} />
        ))}

        {/* Footer actions */}
        <div className="flex border-muted border-t bg-muted/30">
          <div className="flex h-9 items-center gap-2 px-3">
            <Skeleton className="size-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>
          <div className="flex h-9 items-center gap-2 px-3">
            <Skeleton className="size-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <Main className="flex flex-col gap-5" fixed fluid>
      {/* Tabs bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 items-center gap-1 rounded-lg bg-muted px-1">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
        <Skeleton className="size-9 rounded-md" />
      </div>

      {/* Category cards */}
      <SkeletonCategory rows={5} />
      <SkeletonCategory rows={3} />
    </Main>
  );
}

export function Errored({ error }: { error: Error }) {
  return (
    <QueryErrorState
      error={error}
      title="Non siamo riusciti a caricare l'editor del menu"
    />
  );
}

export function Empty() {
  return (
    <EmptyState
      description="Questo menu non contiene ancora una struttura modificabile."
      title="Editor menu non disponibile"
    />
  );
}
