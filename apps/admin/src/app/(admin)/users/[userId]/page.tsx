"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@avo/ui/components/ui/card";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useGetUser } from "@/api/users/use-get-user";
import { Main } from "@/components/layout/main";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data, isLoading } = useGetUser(userId);

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
      <Main className="text-muted-foreground text-sm">Utente non trovato.</Main>
    );
  }

  const user = data.data;

  return (
    <Main className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/users">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-2xl tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dettagli utente</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{user.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefono</dt>
                <dd>{user.phoneNumber ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ruolo</dt>
                <dd>
                  <Badge variant="secondary">{user.role ?? "user"}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email verificata</dt>
                <dd>{user.emailVerified ? "Sì" : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stato</dt>
                <dd>
                  {user.banned ? (
                    <Badge variant="destructive">
                      Bannato{user.banReason ? `: ${user.banReason}` : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Attivo</Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Creato</dt>
                <dd>{format(new Date(user.createdAt), "MMM d, yyyy HH:mm")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Appartenenze venue ({user.memberships.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.memberships.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nessuna appartenenza a venue.
              </p>
            ) : (
              <div className="space-y-3">
                {user.memberships.map((m) => (
                  <div
                    className="flex items-center justify-between rounded-md border p-3"
                    key={m.venueId}
                  >
                    <div>
                      <Link
                        className="font-medium text-primary text-sm hover:underline"
                        href={`/venues/${m.venueId}`}
                      >
                        {m.venueName}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {m.venueSlug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <Badge variant="secondary">{m.role}</Badge>
                      <Badge variant={m.isActive ? "outline" : "destructive"}>
                        {m.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Main>
  );
}
