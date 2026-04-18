"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@avo/ui/components/ui/alert-dialog";
import { Button } from "@avo/ui/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { ModifiedSharedEntry } from "../_utils/menu-editor-state";

interface SharedCatalogDialogProps {
  open: boolean;
  entries: ModifiedSharedEntry[];
  onConfirm: (strategy: "global" | "local") => void;
  onCancel: () => void;
}

export function SharedCatalogDialog({
  open,
  entries,
  onConfirm,
  onCancel,
}: SharedCatalogDialogProps) {
  const hasPriceChanges = entries.some((e) => e.priceChanged);
  const names = entries.map((e) => e.title).join(", ");

  return (
    <AlertDialog onOpenChange={(v) => !v && onCancel()} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-600">
            <ArrowUpDown />
          </AlertDialogMedia>
          <AlertDialogTitle>Voce condivisa</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">{names}</span> è
                presente anche in altri menu. Le modifiche verranno applicate
                ovunque.
              </p>
              {hasPriceChanges ? <p>Come vuoi aggiornare i prezzi?</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annulla</AlertDialogCancel>
          {hasPriceChanges ? (
            <>
              <Button onClick={() => onConfirm("local")} variant="outline">
                Solo in questo menu
              </Button>
              <Button onClick={() => onConfirm("global")}>
                In tutti i menu
              </Button>
            </>
          ) : (
            <Button onClick={() => onConfirm("global")}>Conferma</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
