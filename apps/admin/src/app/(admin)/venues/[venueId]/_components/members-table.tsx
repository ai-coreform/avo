"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { createMembersColumns, type MemberRow } from "./members-columns";

interface MembersTableProps {
  data: MemberRow[];
  venueId: string;
}

export function MembersTable({ data, venueId }: MembersTableProps) {
  const router = useRouter();
  const columns = useMemo(() => createMembersColumns(venueId), [venueId]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTable
      onRowClick={(row) => router.push(`/users/${row.userId}`)}
      showPagination={data.length > 10}
      table={table}
    />
  );
}
