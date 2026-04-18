"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { useCancelInvitation } from "@/api/team/use-cancel-invitation";
import { getColumns, type Invitation } from "./invitations-columns";

interface InvitationsTableProps {
  invitations: Invitation[];
  isOwner: boolean;
}

export function InvitationsTable({
  invitations,
  isOwner,
}: InvitationsTableProps) {
  const cancelInvitation = useCancelInvitation();

  const columns = useMemo(
    () =>
      getColumns({
        isOwner,
        onCancelInvitation: (invitationId) =>
          cancelInvitation.mutate({ invitationId }),
        isCancelling: cancelInvitation.isPending,
      }),
    [isOwner, cancelInvitation.mutate, cancelInvitation.isPending]
  );

  const table = useReactTable({
    data: invitations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <DataTable
      containerClassName="rounded-lg"
      showPagination={false}
      table={table}
    />
  );
}
