"use client";

import type { Invitation } from "./invitations-columns";
import { InvitationsTable } from "./invitations-table";
import { InviteMemberDialog } from "./invite-member-dialog";
import type { Member } from "./members-columns";
import { MembersTable } from "./members-table";

interface ActiveMember {
  id: string;
  role: string;
}

interface TeamPageViewProps {
  members: Member[];
  invitations: Invitation[];
  activeMember: ActiveMember;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
}

export function TeamPageView({
  members,
  invitations,
  activeMember,
  inviteOpen,
  setInviteOpen,
}: TeamPageViewProps) {
  const isOwner = activeMember.role === "owner";
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Membri ({members.length})
        </h3>
        <MembersTable
          currentMemberId={activeMember.id}
          isOwner={isOwner}
          members={members}
        />
      </section>

      {pendingInvitations.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
            Inviti in sospeso ({pendingInvitations.length})
          </h3>
          <InvitationsTable
            invitations={pendingInvitations}
            isOwner={isOwner}
          />
        </section>
      ) : null}

      <InviteMemberDialog onOpenChange={setInviteOpen} open={inviteOpen} />
    </div>
  );
}
