"use client";

import { Input } from "@avo/ui/components/ui/input";
import { useState } from "react";
import { useListVenues } from "@/api/venues/use-list-venues";
import { Main } from "@/components/layout/main";
import { ImportVenueDialog } from "./_components/import-venue-dialog";
import { VenuesTable } from "./_components/venues-table";

export default function VenuesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useListVenues({
    search: search || undefined,
  });

  return (
    <Main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Venues</h1>
          <p className="text-muted-foreground text-sm">
            Gestisci tutte le venue della piattaforma.
          </p>
        </div>
        <ImportVenueDialog onImported={() => refetch()} />
      </div>

      <div className="flex items-center gap-4">
        <Input
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome o slug..."
          type="text"
          value={search}
        />
        {data && (
          <span className="text-muted-foreground text-sm">
            {data.total} venue totali
          </span>
        )}
      </div>

      <VenuesTable data={data?.data ?? []} isLoading={isLoading} />
    </Main>
  );
}
