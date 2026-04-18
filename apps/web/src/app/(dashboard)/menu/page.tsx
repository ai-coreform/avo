"use client";

import { Heading } from "@avo/ui/components/ui/heading";
import { useGetMenus } from "@/api/menu/use-get-menus";
import { Main } from "@/components/layout/main";
import { matchQueryStatus } from "@/lib/match-query-status";
import { CreateMenuButton } from "./_components/create-menu-button";
import { Empty, Errored, Loading, Success } from "./_components/query-states";

function MenuPage() {
  const menusQuery = useGetMenus();

  return (
    <Main className="flex flex-col gap-5">
      <Heading
        ctaButton={<CreateMenuButton>Nuovo menu</CreateMenuButton>}
        description="Crea, modifica e organizza i menu del locale."
        title="Menu"
      />
      {matchQueryStatus(menusQuery, {
        Loading,
        Errored,
        Empty,
        Success,
      })}
      {menusQuery.isFetching && !menusQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Aggiornamento menu...</p>
      ) : null}
    </Main>
  );
}

export default MenuPage;
