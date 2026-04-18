"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@avo/ui/components/ui/alert-dialog";
import { Button } from "@avo/ui/components/ui/button";
import { Dialog, DialogContent } from "@avo/ui/components/ui/dialog";
import { useState } from "react";
import { useRotatePartnerApiKey } from "@/api/partners/hooks";
import { CredentialsBox } from "./credentials-box";

export function RotateKeyButton({
  slug,
  partnerName,
}: {
  slug: string;
  partnerName: string;
}) {
  const rotate = useRotatePartnerApiKey();
  const [immediately, setImmediately] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  async function handleRotate() {
    const res = await rotate.mutateAsync({ slug, immediately });
    const credsResponse = res as {
      credentials?: { api_key: string };
    };
    if (credsResponse.credentials) {
      setApiKey(credsResponse.credentials.api_key);
      setAcknowledged(false);
    }
  }

  function handleClose() {
    setApiKey(null);
    setAcknowledged(false);
    setImmediately(false);
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline">
            Ruota API key
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ruotare la API key di {partnerName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Verrà generata una nuova API key. La vecchia resta valida per 24h
              (a meno che tu non scelga &quot;revoca immediata&quot;).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex items-start gap-2 text-sm">
            <input
              checked={immediately}
              className="mt-1"
              onChange={(e) => setImmediately(e.target.checked)}
              type="checkbox"
            />
            <span>
              <strong className="font-medium">Revoca immediata</strong> — la
              vecchia key invalidata subito (breve downtime lato partner fino al
              deploy della nuova).
            </span>
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRotate}
            >
              Ruota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(next) => {
          if (!next && apiKey && !acknowledged) {
            return;
          }
          if (!next) {
            handleClose();
          }
        }}
        open={apiKey !== null}
      >
        <DialogContent className="sm:max-w-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-semibold">Nuova API key</h2>
              <p className="text-destructive text-sm">
                Copia subito. Non sarà più visibile.
              </p>
            </div>

            {apiKey ? <CredentialsBox label="API Key" value={apiKey} /> : null}

            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-900 text-sm dark:text-amber-100">
              Il webhook_secret NON cambia con la rotazione. Solo la API key è
              nuova.
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                type="checkbox"
              />
              Ho salvato la nuova API key.
            </label>

            <div className="flex justify-end">
              <Button
                disabled={!acknowledged}
                onClick={handleClose}
                type="button"
                variant="destructive"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
