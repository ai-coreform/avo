"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface MenuRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export const menusColumns: ColumnDef<MenuRow>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">
        {row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Stato",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "published" ? "default" : "secondary"}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Creato",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.createdAt), "MMM d, yyyy")}
      </span>
    ),
  },
];
