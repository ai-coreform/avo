"use client";

import { DataTable } from "@avo/ui/components/ui/data-table/data-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { getColumns, type Member } from "./members-columns";
import { RemoveMemberDialog } from "./remove-member-dialog";

interface MembersTableProps {
  members: Member[];
  isOwner: boolean;
  currentMemberId: string;
}

export function MembersTable({
  members,
  isOwner,
  currentMemberId,
}: MembersTableProps) {
  const [removeMember, setRemoveMember] = useState<Member | null>(null);

  const columns = useMemo(
    () =>
      getColumns({ isOwner, currentMemberId, onRemoveMember: setRemoveMember }),
    [isOwner, currentMemberId]
  );

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataTable
        containerClassName="rounded-lg"
        showPagination={false}
        table={table}
      />

      <RemoveMemberDialog
        member={removeMember}
        onClose={() => setRemoveMember(null)}
      />
    </>
  );
}
