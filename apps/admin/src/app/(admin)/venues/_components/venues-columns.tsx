"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { setActiveVenue } from "@/api/venues";
import { DASHBOARD_URL } from "@/config/environment";
import { DeleteVenueDialog } from "./delete-venue-dialog";

export interface VenueRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  createdAt: string;
  memberCount: number;
  menuCount: number;
}

function PreviewButton({ venueId }: { venueId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await setActiveVenue(venueId);
      window.open(DASHBOARD_URL, "_blank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="size-8"
      disabled={loading}
      onClick={handlePreview}
      size="icon"
      variant="ghost"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Eye className="size-4" />
      )}
      <span className="sr-only">Anteprima venue</span>
    </Button>
  );
}

function ActionsCell({ row }: { row: VenueRow }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <PreviewButton venueId={row.id} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-8"
            onClick={(e) => e.stopPropagation()}
            size="icon"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Azioni</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteVenueDialog
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        venueId={row.id}
        venueName={row.name}
        venueSlug={row.slug}
      />
    </div>
  );
}

export const venuesColumns: ColumnDef<VenueRow>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <Link
        className="font-medium text-primary hover:underline"
        href={`/venues/${row.original.id}`}
      >
        {row.original.name}
      </Link>
    ),
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
    id: "location",
    header: "Posizione",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {[row.original.city, row.original.country].filter(Boolean).join(", ") ||
          "-"}
      </span>
    ),
  },
  {
    accessorKey: "memberCount",
    header: "Membri",
  },
  {
    accessorKey: "menuCount",
    header: "Menu",
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
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row.original} />,
  },
];
