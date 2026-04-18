"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type MenuRow, menusColumns } from "./menus-columns";

interface MenusTableProps {
  data: MenuRow[];
}

export function MenusTable({ data }: MenusTableProps) {
  const table = useReactTable({
    data,
    columns: menusColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <DataTable showPagination={data.length > 10} table={table} />;
}
