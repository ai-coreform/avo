"use client";

import { useState } from "react";
import {
  useListPartnerDeliveries,
  useListPartnerLinks,
  useListPartners,
  useResendDelivery,
} from "@/api/partners/hooks";
import { Main } from "@/components/layout/main";
import { NewPartnerDialog } from "./_components/new-partner-dialog";
import { RotateKeyButton } from "./_components/rotate-key-button";

/**
 * Platform admin — partners overview.
 * Lists every partner with per-status link counts, dead-letter count, recent
 * webhook deliveries, and a "Resend" action.
 */
export default function PartnersPage() {
  const { data, isLoading } = useListPartners();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  return (
    <Main className="flex flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="font-bold text-2xl tracking-tight">
            Partner Integrations
          </h1>
          <p className="text-muted-foreground text-sm">
            Stato dei link venue-partner, ultime delivery webhook, resend
            manuale.
          </p>
        </header>
        <NewPartnerDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      ) : (
        <div className="space-y-4">
          {(() => {
            const partners = data && "partners" in data ? data.partners : [];
            if (partners.length === 0) {
              return (
                <p className="text-muted-foreground text-sm">
                  Nessun partner configurato.
                </p>
              );
            }
            return partners.map((p) => (
              <PartnerCard
                isSelected={selectedSlug === p.slug}
                key={p.slug}
                onToggle={() =>
                  setSelectedSlug(selectedSlug === p.slug ? null : p.slug)
                }
                partner={p}
              />
            ));
          })()}
        </div>
      )}
    </Main>
  );
}

type Partners = NonNullable<
  Awaited<ReturnType<typeof useListPartners>>["data"]
>;
type PartnerRow = Partners["partners"][number];

function PartnerCard({
  partner,
  isSelected,
  onToggle,
}: {
  partner: PartnerRow;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <button className="flex-1 text-left" onClick={onToggle} type="button">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{partner.name}</h2>
            <span className="font-mono text-muted-foreground text-xs">
              {partner.slug}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            Webhook URL:{" "}
            <code className="font-mono">{partner.webhook_url}</code>
          </p>
        </button>
        <div className="flex items-center gap-2">
          <RotateKeyButton partnerName={partner.name} slug={partner.slug} />
          <button
            className="text-muted-foreground text-xs"
            onClick={onToggle}
            type="button"
          >
            {isSelected ? "Chiudi ▲" : "Apri ▼"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <LinkStat label="Attivi" tone="ok" value={partner.links.active} />
        <LinkStat
          label="Pending claim"
          tone="warn"
          value={partner.links.pending_claim}
        />
        <LinkStat
          label="Disconnessi"
          tone="muted"
          value={partner.links.revoked}
        />
        <LinkStat
          label="Abbandonati"
          tone="muted"
          value={partner.links.abandoned}
        />
        <LinkStat
          label="Dead letter"
          tone={partner.dead_letter_count > 0 ? "error" : "muted"}
          value={partner.dead_letter_count}
        />
      </div>

      {isSelected ? <PartnerDetail slug={partner.slug} /> : null}
    </section>
  );
}

function LinkStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "error" | "muted";
}) {
  const tones: Record<typeof tone, string> = {
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    error: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-md px-2 py-1 font-medium ${tones[tone]}`}>
      {label}: {value}
    </span>
  );
}

function PartnerDetail({ slug }: { slug: string }) {
  return (
    <div className="space-y-4 border-border border-t pt-4">
      <LinksTable slug={slug} />
      <DeliveriesTable slug={slug} />
    </div>
  );
}

function LinksTable({ slug }: { slug: string }) {
  const { data, isLoading } = useListPartnerLinks(slug);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Caricamento link…</p>;
  }

  const links = data && "links" in data ? data.links : [];
  if (links.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun link.</p>;
  }

  return (
    <div>
      <h3 className="mb-2 font-medium text-sm">Venue links ({links.length})</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground text-xs">
              <th className="py-2">Venue</th>
              <th className="py-2">connect_venue_id</th>
              <th className="py-2">Status</th>
              <th className="py-2">Connesso</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr className="border-b/50" key={l.avo_venue_id}>
                <td className="py-1.5">{l.venue_name}</td>
                <td className="py-1.5">
                  <code className="font-mono text-xs">
                    {l.connect_venue_id}
                  </code>
                </td>
                <td className="py-1.5">{l.status}</td>
                <td className="py-1.5">
                  {new Date(l.connected_at).toLocaleString("it-IT")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeliveriesTable({ slug }: { slug: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useListPartnerDeliveries(slug, {
    status: statusFilter || undefined,
    limit: 100,
  });
  const resend = useResendDelivery(slug);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-medium text-sm">Webhook deliveries</h3>
        <select
          className="rounded-md border px-2 py-1 text-xs"
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
        >
          <option value="">Tutti</option>
          <option value="pending">Pending</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="dead_letter">Dead letter</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground text-xs">
                <th className="py-2">Event</th>
                <th className="py-2">Status</th>
                <th className="py-2">Attempts</th>
                <th className="py-2">Last status</th>
                <th className="py-2">Updated</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(data && "deliveries" in data ? data.deliveries : []).map(
                (d) => (
                  <tr className="border-b/50" key={d.id}>
                    <td className="py-1.5">
                      <code className="font-mono text-xs">{d.event_type}</code>
                    </td>
                    <td className="py-1.5">{d.status}</td>
                    <td className="py-1.5">{d.attempts}</td>
                    <td className="py-1.5">
                      {d.last_status ?? "—"}
                      {d.last_error ? (
                        <span
                          className="ml-2 text-muted-foreground text-xs"
                          title={d.last_error}
                        >
                          ({d.last_error.slice(0, 40)}…)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-1.5">
                      {new Date(d.updated_at).toLocaleTimeString("it-IT")}
                    </td>
                    <td className="py-1.5 text-right">
                      {d.status === "dead_letter" ||
                      d.status === "failed" ||
                      d.status === "pending" ? (
                        <button
                          className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(d.id)}
                          type="button"
                        >
                          Resend
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
