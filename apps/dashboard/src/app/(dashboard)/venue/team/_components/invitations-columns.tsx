"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Invitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  organizationId: string;
  inviterId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  member: "Membro",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

interface GetColumnsParams {
  isOwner: boolean;
  onCancelInvitation: (invitationId: string) => void;
  isCancelling: boolean;
}

export function getColumns({
  isOwner,
  onCancelInvitation,
  isCancelling,
}: GetColumnsParams): ColumnDef<Invitation>[] {
  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: "email",
      header: () => "Email",
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: () => "Ruolo",
      cell: ({ row }) => (
        <Badge variant="outline">
          {ROLE_LABELS[row.original.role ?? "member"] ??
            row.original.role ??
            "Membro"}
        </Badge>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: () => "Scadenza",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.expiresAt)}
        </span>
      ),
    },
  ];

  if (isOwner) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Azioni</span>,
      size: 48,
      cell: ({ row }) => (
        <Button
          disabled={isCancelling}
          onClick={() => onCancelInvitation(row.original.id)}
          size="icon"
          variant="ghost"
        >
          <X className="size-4" />
          <span className="sr-only">Annulla invito</span>
        </Button>
      ),
    });
  }

  return columns;
}
