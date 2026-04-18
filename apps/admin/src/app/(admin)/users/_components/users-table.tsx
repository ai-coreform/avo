"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { type UserRow, usersColumns } from "./users-columns";

interface UsersTableProps {
  data: UserRow[];
  isLoading?: boolean;
}

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const router = useRouter();

  const table = useReactTable({
    data,
    columns: usersColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  return (
    <DataTable
      isLoading={isLoading}
      onRowClick={(row) => router.push(`/users/${row.id}`)}
      table={table}
    />
  );
}
