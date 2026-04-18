"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { type VenueRow, venuesColumns } from "./venues-columns";

interface VenuesTableProps {
  data: VenueRow[];
  isLoading?: boolean;
}

export function VenuesTable({ data, isLoading }: VenuesTableProps) {
  const router = useRouter();

  const table = useReactTable({
    data,
    columns: venuesColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  return (
    <DataTable
      isLoading={isLoading}
      onRowClick={(row) => router.push(`/venues/${row.id}`)}
      table={table}
    />
  );
}
