"use client";

import { Card, CardContent } from "@avo/ui/components/ui/card";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { BarChart3, Store, UserCheck, Users } from "lucide-react";
import { useOverviewStats } from "@/api/overview/use-overview-stats";
import { Main } from "@/components/layout/main";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground text-sm">{label}</p>
          <p className="font-bold text-2xl">
            {value !== undefined ? value : "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { data, isLoading } = useOverviewStats();

  return (
    <Main className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Panoramica</h1>
        <p className="text-muted-foreground text-sm">
          Statistiche e metriche della piattaforma.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["users", "venues", "menus", "memberships"].map((key) => (
            <Card key={key}>
              <CardContent className="flex items-center gap-3 p-6">
                <Skeleton className="size-9 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Utenti totali"
            value={data?.data.totalUsers}
          />
          <StatCard
            icon={Store}
            label="Venues totali"
            value={data?.data.totalVenues}
          />
          <StatCard
            icon={BarChart3}
            label="Menu totali"
            value={data?.data.totalMenus}
          />
          <StatCard
            icon={UserCheck}
            label="Membri totali"
            value={data?.data.totalMemberships}
          />
        </div>
      )}
    </Main>
  );
}
