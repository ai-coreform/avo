"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@avo/ui/components/ui/alert-dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDeleteVenue } from "@/api/venues/use-delete-venue";

interface DeleteVenueDialogProps {
  venueId: string;
  venueName: string;
  venueSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteVenueDialog({
  venueId,
  venueName,
  venueSlug,
  open,
  onOpenChange,
}: DeleteVenueDialogProps) {
  const deleteMutation = useDeleteVenue();
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation === venueSlug;

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setConfirmation("");
    }
    onOpenChange(value);
  };

  const handleDelete = () => {
    if (!isConfirmed) {
      return;
    }
    deleteMutation.mutate(venueId, {
      onSuccess: () => {
        setConfirmation("");
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Eliminare {venueName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione eliminerà permanentemente il venue e tutti i dati
            associati, inclusi menu, categorie, articoli e traduzioni. I membri
            che appartengono solo a questo venue verranno rimossi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="deleteConfirmation">
            Digita{" "}
            <span className="font-mono font-semibold text-destructive">
              {venueSlug}
            </span>{" "}
            per confermare
          </Label>
          <Input
            autoComplete="off"
            id="deleteConfirmation"
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={venueSlug}
            value={confirmation}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmed || deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Eliminazione...
              </>
            ) : (
              "Elimina"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
