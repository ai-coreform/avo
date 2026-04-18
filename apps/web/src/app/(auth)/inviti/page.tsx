"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
import { InvitationCard } from "./_components/invitation-card";

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

export default function InvitiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smart redirect: check if the invited email is already registered,
  // then redirect to /accedi or /registrati accordingly.
  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    // Already authenticated — skip redirect
    if (sessionData?.user) {
      return;
    }

    const invitationId = searchParams.get("id");
    const currentPath = `/inviti${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const redirectTo = encodeURIComponent(currentPath);

    if (!invitationId) {
      // No invitation ID — fall back to login
      router.replace(`/accedi?redirect_to=${redirectTo}`);
      return;
    }

    let cancelled = false;

    async function checkAndRedirect() {
      try {
        const res = await client.api.public.invitation["check-email"].$get({
          query: { id: invitationId as string },
        });
        const json = await res.json();

        if (cancelled) {
          return;
        }

        if (!("data" in json)) {
          router.replace(`/accedi?redirect_to=${redirectTo}`);
          return;
        }

        const emailParam = `&email=${encodeURIComponent(json.data.email)}`;

        if (json.data.isRegistered) {
          router.replace(`/accedi?redirect_to=${redirectTo}${emailParam}`);
        } else {
          router.replace(`/registrati?redirect_to=${redirectTo}${emailParam}`);
        }
      } catch {
        if (!cancelled) {
          // Invitation invalid/expired — fall back to login
          router.replace(`/accedi?redirect_to=${redirectTo}`);
        }
      }
    }

    checkAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [sessionData, isSessionPending, router, searchParams]);

  // Fetch user invitations (only when authenticated)
  useEffect(() => {
    if (!sessionData?.user) {
      return;
    }

    async function fetchInvitations() {
      try {
        setIsLoading(true);
        const response = await authClient.organization.listUserInvitations();
        if (response.error) {
          setError(
            response.error.message ?? "Errore nel caricamento degli inviti"
          );
          return;
        }
        setInvitations(
          (response.data ?? []).filter(
            (inv: Invitation) => inv.status === "pending"
          )
        );
      } catch {
        setError("Errore nel caricamento degli inviti");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvitations();
  }, [sessionData?.user]);

  function handleRemoveInvitation(invitationId: string) {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  }

  if (isSessionPending || !sessionData?.user) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h2 className="font-semibold text-xl">Nessun invito in sospeso</h2>
        <p className="text-center text-muted-foreground text-sm">
          Non hai inviti in attesa al momento.
        </p>
        <button
          className="text-primary text-sm underline underline-offset-4"
          onClick={() => router.replace("/menu")}
          type="button"
        >
          Vai alla dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="font-bold text-2xl">I tuoi inviti</h2>
        <p className="text-muted-foreground text-sm">
          Hai {invitations.length} invit
          {invitations.length === 1 ? "o" : "i"} in attesa.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        {invitations.map((invitation) => (
          <InvitationCard
            invitation={invitation}
            key={invitation.id}
            onRemove={handleRemoveInvitation}
          />
        ))}
      </div>
    </div>
  );
}
