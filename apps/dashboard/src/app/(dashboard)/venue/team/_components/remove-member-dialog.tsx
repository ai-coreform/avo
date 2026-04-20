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
} from "@avo/ui/components/ui/alert-dialog";
import { useRemoveMember } from "@/api/team/use-remove-member";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RemoveMemberDialogProps {
  member: Member | null;
  onClose: () => void;
}

export function RemoveMemberDialog({
  member,
  onClose,
}: RemoveMemberDialogProps) {
  const removeMember = useRemoveMember();

  function handleConfirm() {
    if (!member) {
      return;
    }

    removeMember.mutate(
      {
        memberIdOrEmail: member.id,
        displayName: member.user.name,
      },
      { onSettled: onClose }
    );
  }

  return (
    <AlertDialog onOpenChange={(open) => !open && onClose()} open={!!member}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rimuovi membro</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler rimuovere <strong>{member?.user.name}</strong>{" "}
            dal team? Questa azione non può essere annullata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={removeMember.isPending}
            onClick={handleConfirm}
          >
            {removeMember.isPending ? "Rimozione..." : "Rimuovi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
