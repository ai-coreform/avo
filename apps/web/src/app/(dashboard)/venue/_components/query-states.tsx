import { Skeleton } from "@avo/ui/components/ui/skeleton";
import type { VenueData } from "@/api/venue/types";
import { VenuePageView } from "./venue-page-view";

export function Loading() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[360px] w-full max-w-xl rounded-2xl" />
      </div>
    </div>
  );
}

export function Errored() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-muted-foreground text-sm">
        Errore nel caricamento del locale. Riprova.
      </p>
    </div>
  );
}

export function Empty() {
  return <Errored />;
}

export function Success({ data }: { data: VenueData }) {
  return <VenuePageView data={data} />;
}
