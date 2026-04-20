"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@avo/ui/components/ui/avatar";
import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietario",
  admin: "Admin",
  member: "Membro",
};

function getRoleVariant(role: string) {
  if (role === "owner") {
    return "default" as const;
  }
  if (role === "admin") {
    return "secondary" as const;
  }
  return "outline" as const;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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
  currentMemberId: string;
  onRemoveMember: (member: Member) => void;
}

export function getColumns({
  isOwner,
  currentMemberId,
  onRemoveMember,
}: GetColumnsParams): ColumnDef<Member>[] {
  const columns: ColumnDef<Member>[] = [
    {
      id: "user",
      header: () => "Utente",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {member.user.image ? (
                <AvatarImage alt={member.user.name} src={member.user.image} />
              ) : null}
              <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{member.user.name}</p>
              <p className="truncate text-muted-foreground text-xs">
                {member.user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: () => "Ruolo",
      cell: ({ row }) => (
        <Badge variant={getRoleVariant(row.original.role)}>
          {ROLE_LABELS[row.original.role] ?? row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => "Data ingresso",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  if (isOwner) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Azioni</span>,
      size: 48,
      cell: ({ row }) => {
        const member = row.original;

        if (member.role === "owner" || member.id === currentMemberId) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Azioni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onRemoveMember(member)}
              >
                Rimuovi membro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
