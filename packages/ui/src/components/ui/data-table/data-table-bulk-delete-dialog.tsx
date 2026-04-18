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
import { Loader2, Trash2 } from "lucide-react";

interface DataTableBulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRowsCount: number;
  selectedSingularLabel: string;
  selectedPluralLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  description?: string;
  triggerLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DataTableBulkDeleteDialog({
  open,
  onOpenChange,
  selectedRowsCount,
  selectedSingularLabel,
  selectedPluralLabel,
  onConfirm,
  isPending = false,
  description = "Questa azione non puo' essere annullata.",
  triggerLabel = "Elimina selezionati",
  confirmLabel = "Elimina",
  cancelLabel = "Annulla",
}: DataTableBulkDeleteDialogProps) {
  const title =
    selectedRowsCount === 1
      ? `Eliminare ${selectedSingularLabel} selezionato?`
      : `Eliminare ${selectedRowsCount} ${selectedPluralLabel} selezionati?`;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} size="sm" variant="destructive">
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" />
          )}
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            variant="destructive"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
