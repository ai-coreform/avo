"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/environment";

/**
 * Integrations settings page — lists every partner currently linked to the
 * owner's venue and lets them disconnect.
 *
 * `/venue/integrations` — protected by the existing dashboard layout guard.
 */

interface IntegrationRow {
  partner: {
    slug: string;
    name: string;
  };
  link: {
    status: "pending_claim" | "active" | "revoked" | "abandoned";
    connect_venue_id: string;
    connected_at: string;
    disconnected_at: string | null;
  };
  health: {
    last_delivered_at: string | null;
    last_failed_at: string | null;
    pending_count: number;
    dead_letter_count: number;
  };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationRow[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [disconnectingSlug, setDisconnectingSlug] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchIntegrations()
      .then(setIntegrations)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Errore");
      });
  }, []);

  async function handleDisconnect(slug: string) {
    // biome-ignore lint/suspicious/noAlert: native confirm is acceptable for v1; swap for a proper modal in a follow-up.
    const ok = window.confirm(
      "Disconnettere questa integrazione? Gli articoli esistenti rimangono ma non verranno più sincronizzati."
    );
    if (!ok) {
      return;
    }
    setDisconnectingSlug(slug);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/manage/integrations/${encodeURIComponent(slug)}/disconnect`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error(`Disconnessione fallita (${res.status})`);
      }
      const updated = await fetchIntegrations();
      setIntegrations(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setDisconnectingSlug(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <header className="space-y-2">
        <h1 className="font-semibold text-2xl">Integrazioni</h1>
        <p className="text-muted-foreground text-sm">
          Gestionali e POS che hanno accesso al catalogo di questo locale.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      ) : null}

      <IntegrationsBody
        disconnectingSlug={disconnectingSlug}
        integrations={integrations}
        onDisconnect={handleDisconnect}
      />
    </main>
  );
}

function IntegrationsBody({
  integrations,
  disconnectingSlug,
  onDisconnect,
}: {
  integrations: IntegrationRow[] | null;
  disconnectingSlug: string | null;
  onDisconnect: (slug: string) => void;
}) {
  if (integrations === null) {
    return <div className="text-muted-foreground text-sm">Caricamento…</div>;
  }
  if (integrations.length === 0) {
    return <EmptyState />;
  }
  return (
    <ul className="space-y-4">
      {integrations.map((i) => (
        <IntegrationCard
          disconnecting={disconnectingSlug === i.partner.slug}
          integration={i}
          key={i.partner.slug}
          onDisconnect={() => onDisconnect(i.partner.slug)}
        />
      ))}
    </ul>
  );
}

function IntegrationCard({
  integration,
  disconnecting,
  onDisconnect,
}: {
  integration: IntegrationRow;
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  const { partner, link, health } = integration;
  const isActive = link.status === "active";
  const isRevoked = link.status === "revoked" || link.status === "abandoned";

  return (
    <li className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-medium">{partner.name}</h2>
            <StatusPill status={link.status} />
          </div>
          <p className="text-muted-foreground text-xs">
            ID locale su {partner.name}:{" "}
            <code className="font-mono">{link.connect_venue_id}</code>
          </p>
          <p className="text-muted-foreground text-xs">
            Collegato il {formatDate(link.connected_at)}
            {link.disconnected_at
              ? ` · Disconnesso il ${formatDate(link.disconnected_at)}`
              : ""}
          </p>
        </div>

        {isActive ? (
          <button
            className="rounded-md border border-border px-3 py-1.5 font-medium text-destructive text-sm hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disconnecting}
            onClick={onDisconnect}
            type="button"
          >
            {disconnecting ? "Disconnetto…" : "Disconnetti"}
          </button>
        ) : null}
      </div>

      {isActive ? <SyncStatusRow health={health} /> : null}

      {isRevoked ? (
        <p className="text-muted-foreground text-sm">
          L&apos;integrazione è disconnessa. Gli articoli creati da{" "}
          {partner.name} sono ancora presenti ma non vengono più sincronizzati.
        </p>
      ) : null}
    </li>
  );
}

function StatusPill({ status }: { status: IntegrationRow["link"]["status"] }) {
  const labels: Record<IntegrationRow["link"]["status"], string> = {
    active: "Attiva",
    pending_claim: "In attivazione",
    revoked: "Disconnessa",
    abandoned: "Abbandonata",
  };
  const color: Record<IntegrationRow["link"]["status"], string> = {
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    pending_claim: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    revoked: "bg-muted text-muted-foreground",
    abandoned: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-medium text-xs ${color[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function SyncStatusRow({ health }: { health: IntegrationRow["health"] }) {
  const state = computeSyncState(health);

  const tones: Record<typeof state.tone, string> = {
    ok: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-900 dark:text-amber-100 border-amber-500/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    idle: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className={`rounded-md border p-3 text-sm ${tones[state.tone]}`}>
      <p className="font-medium">{state.title}</p>
      <p className="opacity-80">{state.detail}</p>
    </div>
  );
}

type SyncTone = "ok" | "warning" | "error" | "idle";
interface SyncState {
  tone: SyncTone;
  title: string;
  detail: string;
}

function computeSyncState(health: IntegrationRow["health"]): SyncState {
  if (health.dead_letter_count > 0) {
    return {
      tone: "error",
      title: "Sincronizzazione non riuscita",
      detail: `${health.dead_letter_count} event${health.dead_letter_count === 1 ? "o" : "i"} non consegnat${health.dead_letter_count === 1 ? "o" : "i"} all'integrazione. Contatta il supporto.`,
    };
  }
  if (health.pending_count > 10) {
    return {
      tone: "warning",
      title: "Sincronizzazione in ritardo",
      detail: `${health.pending_count} eventi in coda. Riproveremo automaticamente.`,
    };
  }
  if (health.last_delivered_at) {
    return {
      tone: "ok",
      title: "Sincronizzazione attiva",
      detail: `Ultimo sync: ${formatRelative(health.last_delivered_at)}.`,
    };
  }
  return {
    tone: "idle",
    title: "Nessuna sincronizzazione finora",
    detail:
      "Appena farai una modifica nel menu, verrà notificata all'integrazione.",
  };
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border border-dashed p-8 text-center">
      <p className="font-medium">Nessuna integrazione attiva</p>
      <p className="mt-2 text-muted-foreground text-sm">
        Quando il tuo gestionale ti collegherà ad Avo, lo vedrai comparire qui.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

async function fetchIntegrations(): Promise<IntegrationRow[]> {
  const res = await fetch(`${API_BASE_URL}/api/manage/integrations`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Caricamento integrazioni fallito (${res.status})`);
  }
  const json = (await res.json()) as { integrations: IntegrationRow[] };
  return json.integrations;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) {
    return "pochi secondi fa";
  }
  if (minutes < 60) {
    return `${minutes} min fa`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} or${hours === 1 ? "a" : "e"} fa`;
  }
  const days = Math.round(hours / 24);
  return `${days} giorn${days === 1 ? "o" : "i"} fa`;
}
