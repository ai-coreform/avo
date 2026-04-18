"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EditMemberDialog } from "./edit-member-dialog";

export interface MemberRow {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

function EditMemberCell({ row, venueId }: { row: MemberRow; venueId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="size-8"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        size="icon"
        variant="ghost"
      >
        <Pencil className="size-4" />
        <span className="sr-only">Modifica membro</span>
      </Button>
      <EditMemberDialog
        member={row}
        onOpenChange={setOpen}
        open={open}
        venueId={venueId}
      />
    </>
  );
}

export function createMembersColumns(venueId: string): ColumnDef<MemberRow>[] {
  return [
    {
      accessorKey: "userName",
      header: "Nome",
      cell: ({ row }) => (
        <Link
          className="font-medium text-primary hover:underline"
          href={`/users/${row.original.userId}`}
        >
          {row.original.userName}
        </Link>
      ),
    },
    {
      accessorKey: "userEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.userEmail}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Ruolo",
      cell: ({ row }) => <Badge variant="secondary">{row.original.role}</Badge>,
    },
    {
      accessorKey: "isActive",
      header: "Stato",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline">Attivo</Badge>
        ) : (
          <Badge variant="destructive">Inattivo</Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <EditMemberCell row={row.original} venueId={venueId} />
      ),
    },
  ];
}
