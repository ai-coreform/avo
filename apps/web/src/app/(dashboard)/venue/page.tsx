"use client";

import { Heading } from "@avo/ui/components/ui/heading";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { Main } from "@/components/layout/main";
import { matchQueryStatus } from "@/lib/match-query-status";
import { Empty, Errored, Loading, Success } from "./_components/query-states";

function VenuePage() {
  const venueQuery = useGetVenue();

  return (
    <Main className="flex flex-col gap-0 p-0!" fluid>
      <div className="shrink-0 px-4 pt-6 pb-4">
        <Heading
          description="Gestisci nome, indirizzo e link social della tua attività."
          title="La tua attività"
        />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {matchQueryStatus(venueQuery, {
          Loading,
          Errored,
          Empty,
          Success,
        })}
      </div>
    </Main>
  );
}

export default VenuePage;
