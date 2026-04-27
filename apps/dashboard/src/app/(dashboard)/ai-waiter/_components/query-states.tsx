import { Skeleton } from "@avo/ui/components/ui/skeleton";
import type { MenuListItem } from "@/api/menu/types";
import { AiWaiterPageView } from "./ai-waiter-page-view";

export function Loading() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full max-w-3xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
            <Skeleton className="h-32" key={key} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Errored() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-muted-foreground text-sm">
        Errore nel caricamento dei menu. Riprova.
      </p>
    </div>
  );
}

export function Empty() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-muted-foreground text-sm">
        Nessun menu trovato. Crea un menu prima di configurare l&apos;assistente.
      </p>
    </div>
  );
}

export function Success({
  data,
}: {
  data: { menus: MenuListItem[]; venueSlug: string | null };
}) {
  return (
    <div className="h-full min-w-0 overflow-hidden">
      <AiWaiterPageView data={data} />
    </div>
  );
}
