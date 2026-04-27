"use client";

import { matchQueryStatus } from "@avo/ui/lib/match-query-status";
import { useGetLocales } from "@/api/locales/use-get-locales";
import { Main } from "@/components/layout/main";
import { Empty, Errored, Loading, Success } from "./_components/query-states";

function TranslationsPage() {
  const localesQuery = useGetLocales();

  return (
    <Main className="flex flex-col gap-0 p-0!" fixed fluid>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-6">
        {matchQueryStatus(localesQuery, {
          Loading,
          Errored,
          Empty,
          Success,
        })}
      </div>
    </Main>
  );
}

export default TranslationsPage;
