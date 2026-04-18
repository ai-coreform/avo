"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@avo/ui/components/ui/card";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useGetVenue } from "@/api/venues/use-get-venue";
import { Main } from "@/components/layout/main";
import { EditVenueDialog } from "./_components/edit-venue-dialog";
import { MembersTable } from "./_components/members-table";
import { MenusTable } from "./_components/menus-table";

export default function VenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = use(params);
  const { data, isLoading } = useGetVenue(venueId);
  const [editVenueOpen, setEditVenueOpen] = useState(false);

  if (isLoading) {
    return (
      <Main className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </Main>
    );
  }

  if (!data) {
    return (
      <Main className="text-muted-foreground text-sm">Venue non trovato.</Main>
    );
  }

  const venue = data.data;

  return (
    <Main className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/venues">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-2xl tracking-tight">{venue.name}</h1>
          <p className="font-mono text-muted-foreground text-sm">
            {venue.slug}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dettagli venue</CardTitle>
          <Button
            onClick={() => setEditVenueOpen(true)}
            size="sm"
            variant="outline"
          >
            <Pencil className="size-4" />
            Modifica
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{venue.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Città</dt>
              <dd>{venue.city ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Paese</dt>
              <dd>{venue.country ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Indirizzo</dt>
              <dd>{venue.address ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fuso orario</dt>
              <dd>{venue.timezone ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lingua predefinita</dt>
              <dd>{venue.defaultLocale ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Creato</dt>
              <dd>{format(new Date(venue.createdAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membri ({venue.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {venue.members.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun membro.</p>
          ) : (
            <MembersTable data={venue.members} venueId={venueId} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu ({venue.menus.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {venue.menus.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun menu.</p>
          ) : (
            <MenusTable data={venue.menus} />
          )}
        </CardContent>
      </Card>

      <EditVenueDialog
        onOpenChange={setEditVenueOpen}
        open={editVenueOpen}
        venue={venue}
      />
    </Main>
  );
}
