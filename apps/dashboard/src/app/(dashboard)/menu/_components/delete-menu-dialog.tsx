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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MenuListItem } from "@/api/menu/types";
import { useDeleteMenu } from "@/api/menu/use-delete-menu";

interface DeleteMenuDialogProps {
  menu: MenuListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMenuDialog({
  menu,
  open,
  onOpenChange,
}: DeleteMenuDialogProps) {
  const deleteMenu = useDeleteMenu();

  async function handleDelete() {
    await deleteMenu.mutateAsync(menu.slug);
    onOpenChange(false);
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Eliminare questo menu?</AlertDialogTitle>
          <AlertDialogDescription>
            Il menu <strong>{menu.name}</strong> verra rimosso definitivamente.
            Le entita collegate verranno eliminate dal database in cascata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMenu.isPending}>
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMenu.isPending}
            onClick={(event) => {
              event.preventDefault();

              toast.promise(handleDelete(), {
                loading: "Eliminazione menu in corso...",
                success: "Menu eliminato correttamente",
                error: (error) =>
                  error instanceof Error
                    ? error.message
                    : "Non siamo riusciti a eliminare il menu. Riprova.",
              });
            }}
            variant="destructive"
          >
            {deleteMenu.isPending ? "Eliminazione..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
