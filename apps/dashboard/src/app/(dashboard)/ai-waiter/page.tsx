"use client";

import { useGetMenus } from "@/api/menu/use-get-menus";
import { Main } from "@/components/layout/main";
import { matchQueryStatus } from "@/lib/match-query-status";
import { Empty, Errored, Loading, Success } from "./_components/query-states";

function AiWaiterPage() {
  const menusQuery = useGetMenus();

  return (
    <Main className="flex flex-col gap-0 p-0!" fixed fluid>
      <div className="min-h-0 min-w-0 flex-1">
        {matchQueryStatus(menusQuery, {
          Loading,
          Errored,
          Empty,
          Success,
        })}
      </div>
    </Main>
  );
}

export default AiWaiterPage;
