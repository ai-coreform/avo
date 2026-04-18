"use client";

import { Input } from "@avo/ui/components/ui/input";
import { useState } from "react";
import { useListUsers } from "@/api/users/use-list-users";
import { Main } from "@/components/layout/main";
import { UsersTable } from "./_components/users-table";

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListUsers({
    search: search || undefined,
  });

  return (
    <Main className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Utenti</h1>
        <p className="text-muted-foreground text-sm">
          Gestisci tutti gli utenti della piattaforma.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome o email..."
          type="text"
          value={search}
        />
        {data && (
          <span className="text-muted-foreground text-sm">
            {data.total} utenti totali
          </span>
        )}
      </div>

      <UsersTable data={data?.data ?? []} isLoading={isLoading} />
    </Main>
  );
}
