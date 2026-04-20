"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import { Card } from "@avo/ui/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietario",
  admin: "Admin",
  member: "Membro",
};

interface Invitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  organizationId: string;
  organizationName?: string;
  inviterName?: string;
  inviterEmail?: string;
}

interface InvitationCardProps {
  invitation: Invitation;
  onRemove: (id: string) => void;
}

export function InvitationCard({ invitation, onRemove }: InvitationCardProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const isPending = isAccepting || isRejecting;

  async function handleAccept() {
    try {
      setIsAccepting(true);
      const result = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });
      if (result.error) {
        toast.error(
          result.error.message ?? "Errore nell'accettazione dell'invito"
        );
        return;
      }

      // Switch to the newly joined venue
      await authClient.organization.setActive({
        organizationId: invitation.organizationId,
      });

      toast.success(
        invitation.organizationName
          ? `Hai accettato l'invito per ${invitation.organizationName}`
          : "Invito accettato"
      );
      router.replace("/venue");
    } catch {
      toast.error("Errore nell'accettazione dell'invito");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleReject() {
    try {
      setIsRejecting(true);
      const result = await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Errore nel rifiuto dell'invito");
        return;
      }
      toast.success("Invito rifiutato");
      onRemove(invitation.id);
    } catch {
      toast.error("Errore nel rifiuto dell'invito");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="space-y-1">
          {invitation.organizationName ? (
            <h3 className="font-semibold text-base">
              {invitation.organizationName}
            </h3>
          ) : null}
          {invitation.inviterName ? (
            <p className="text-muted-foreground text-sm">
              Invitato da{" "}
              <span className="font-medium text-foreground">
                {invitation.inviterName}
              </span>
              {invitation.inviterEmail ? (
                <span className="text-muted-foreground">
                  {" "}
                  ({invitation.inviterEmail})
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Ruolo:</span>
            <Badge variant="outline">
              {ROLE_LABELS[invitation.role ?? "member"] ??
                invitation.role ??
                "Membro"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={handleAccept}
          >
            {isAccepting ? <Loader2 className="size-4 animate-spin" /> : null}
            Accetta
          </Button>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={handleReject}
            variant="outline"
          >
            {isRejecting ? <Loader2 className="size-4 animate-spin" /> : null}
            Rifiuta
          </Button>
        </div>
      </div>
    </Card>
  );
}
