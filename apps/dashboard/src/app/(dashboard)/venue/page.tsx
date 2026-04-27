"use client";

import { matchQueryStatus } from "@avo/ui/lib/match-query-status";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { Main } from "@/components/layout/main";
import { Empty, Errored, Loading, Success } from "./_components/query-states";

function VenuePage() {
  const venueQuery = useGetVenue();

  return (
    <Main className="flex flex-col gap-0 p-0!" fluid>
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
