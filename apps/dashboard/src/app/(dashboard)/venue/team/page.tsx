"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useGetActiveMember } from "@/api/team/use-get-active-member";
import { useListInvitations } from "@/api/team/use-list-invitations";
import { useListMembers } from "@/api/team/use-list-members";
import { Main } from "@/components/layout/main";
import { PageActions } from "@/providers/page-header-provider";
import { TeamPageView } from "./_components/team-page-view";

function TeamPage() {
  const membersQuery = useListMembers();
  const invitationsQuery = useListInvitations();
  const activeMemberQuery = useGetActiveMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  const isLoading =
    membersQuery.isLoading ||
    invitationsQuery.isLoading ||
    activeMemberQuery.isLoading;

  const isError =
    membersQuery.isError ||
    invitationsQuery.isError ||
    activeMemberQuery.isError;

  const isOwner = activeMemberQuery.data?.role === "owner";

  return (
    <Main className="flex flex-col gap-0 p-0!" fluid>
      {isOwner && (
        <PageActions>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invita membro
          </Button>
        </PageActions>
      )}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
        <TeamContent
          activeMemberQuery={activeMemberQuery}
          invitationsQuery={invitationsQuery}
          inviteOpen={inviteOpen}
          isError={isError}
          isLoading={isLoading}
          membersQuery={membersQuery}
          setInviteOpen={setInviteOpen}
        />
      </div>
    </Main>
  );
}

function TeamContent({
  isLoading,
  isError,
  membersQuery,
  invitationsQuery,
  activeMemberQuery,
  inviteOpen,
  setInviteOpen,
}: {
  isLoading: boolean;
  isError: boolean;
  membersQuery: ReturnType<typeof useListMembers>;
  invitationsQuery: ReturnType<typeof useListInvitations>;
  activeMemberQuery: ReturnType<typeof useGetActiveMember>;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
}) {
  if (isLoading) {
    return <Loading />;
  }

  if (isError || !activeMemberQuery.data) {
    return <Errored />;
  }

  return (
    <TeamPageView
      activeMember={activeMemberQuery.data}
      invitations={invitationsQuery.data ?? []}
      inviteOpen={inviteOpen}
      members={membersQuery.data ?? []}
      setInviteOpen={setInviteOpen}
    />
  );
}

function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function Errored() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-muted-foreground text-sm">
        Errore nel caricamento del team. Riprova.
      </p>
    </div>
  );
}

export default TeamPage;
