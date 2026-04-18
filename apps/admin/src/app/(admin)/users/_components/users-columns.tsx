"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

export const usersColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <Link
        className="font-medium text-primary hover:underline"
        href={`/users/${row.original.id}`}
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Ruolo",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.role ?? "user"}</Badge>
    ),
  },
  {
    accessorKey: "banned",
    header: "Stato",
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant="destructive">Bannato</Badge>
      ) : (
        <Badge variant="outline">Attivo</Badge>
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
