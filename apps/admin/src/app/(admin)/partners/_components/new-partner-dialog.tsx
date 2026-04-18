"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@avo/ui/components/ui/dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import { useState } from "react";
import { useCreatePartner } from "@/api/partners/hooks";
import { CredentialsBox } from "./credentials-box";

/**
 * "Add partner" dialog. Walks the operator through a simple create form,
 * then swaps to a one-time credentials display. The dialog refuses to close
 * the credentials view until the operator acknowledges.
 */
export function NewPartnerDialog() {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<{
    apiKey: string;
    webhookSecret: string;
  } | null>(null);

  function reset() {
    setCredentials(null);
    setOpen(false);
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && credentials) {
          return; // block close while credentials are visible
        }
        setOpen(next);
        if (!next) {
          setCredentials(null);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm">Aggiungi partner</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {credentials ? (
          <CredentialsView credentials={credentials} onAcknowledge={reset} />
        ) : (
          <CreatePartnerForm onCreated={(c) => setCredentials(c)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatePartnerForm({
  onCreated,
}: {
  onCreated: (creds: { apiKey: string; webhookSecret: string }) => void;
}) {
  const createMut = useCreatePartner();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const cidrs = ipAllowlist
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const res = await createMut.mutateAsync({
        slug,
        name,
        webhook_url: webhookUrl,
        ip_allowlist: cidrs.length > 0 ? cidrs : undefined,
      });
      if ("error" in res) {
        setError(
          (res as { error: { message: string } }).error.message ??
            "Creazione fallita"
        );
        return;
      }
      const credsResponse = res as {
        credentials?: { api_key: string; webhook_secret: string };
      };
      if (!credsResponse.credentials) {
        setError("Response senza credenziali.");
        return;
      }
      onCreated({
        apiKey: credsResponse.credentials.api_key,
        webhookSecret: credsResponse.credentials.webhook_secret,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Aggiungi un nuovo partner</DialogTitle>
        <DialogDescription>
          Crea un nuovo partner integration. Al termine otterrai API key +
          webhook secret una sola volta.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          pattern="^[a-z][a-z0-9-]{1,39}$"
          placeholder="connect"
          required
          value={slug}
        />
        <p className="text-muted-foreground text-xs">
          Lowercase, alfanumerico + trattini. Es: <code>connect</code>,{" "}
          <code>gestio</code>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Connect"
          required
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          onChange={(e) => setWebhookUrl(e.target.value)}
          pattern="^https://.+"
          placeholder="https://api.connect.example/avo/webhook"
          required
          type="url"
          value={webhookUrl}
        />
        <p className="text-muted-foreground text-xs">
          Solo HTTPS. Dove Avo invierà gli eventi webhook.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ip-allowlist">IP allowlist (opzionale)</Label>
        <Input
          id="ip-allowlist"
          onChange={(e) => setIpAllowlist(e.target.value)}
          placeholder="203.0.113.0/24, 10.0.0.0/8"
          value={ipAllowlist}
        />
        <p className="text-muted-foreground text-xs">
          CIDR separati da virgola. Lascia vuoto per consentire qualsiasi IP.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
          {error}
        </div>
      ) : null}

      <DialogFooter>
        <Button disabled={createMut.isPending} type="submit">
          {createMut.isPending ? "Creazione..." : "Crea partner"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CredentialsView({
  credentials,
  onAcknowledge,
}: {
  credentials: { apiKey: string; webhookSecret: string };
  onAcknowledge: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Credenziali create</DialogTitle>
        <DialogDescription className="text-destructive">
          Copia subito queste credenziali. Non saranno più visibili dopo aver
          chiuso questa finestra.
        </DialogDescription>
      </DialogHeader>

      <CredentialsBox label="API Key" value={credentials.apiKey} />
      <CredentialsBox
        label="Webhook Secret"
        value={credentials.webhookSecret}
      />

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-900 text-sm dark:text-amber-100">
        <strong className="font-medium">Consegna sicura:</strong> Inserisci
        entrambi i valori in 1Password o un canale cifrato prima di chiudere.
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          type="checkbox"
        />
        Ho salvato le credenziali in un canale sicuro.
      </label>

      <DialogFooter>
        <Button
          disabled={!acknowledged}
          onClick={onAcknowledge}
          type="button"
          variant="destructive"
        >
          Chiudi e dimentica
        </Button>
      </DialogFooter>
    </div>
  );
}
