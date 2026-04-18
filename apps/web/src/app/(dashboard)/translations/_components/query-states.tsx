import type { GetLocalesResponse } from "@/api/locales/types";
import { TranslationsPageView } from "./translations-page-view";

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}

export function Errored() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-700 text-sm">
        Errore nel caricamento delle lingue.
      </p>
      <p className="mt-1 text-red-600 text-xs">
        Ricarica la pagina per riprovare.
      </p>
    </div>
  );
}

export function Empty() {
  return <TranslationsPageView locales={[]} />;
}

export function Success({ data }: { data: GetLocalesResponse }) {
  return <TranslationsPageView locales={data.data} />;
}
