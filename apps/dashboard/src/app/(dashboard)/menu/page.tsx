"use client";

import { Button } from "@avo/ui/components/ui/button";
import { matchQueryStatus } from "@avo/ui/lib/match-query-status";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { useGetMenus } from "@/api/menu/use-get-menus";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { Main } from "@/components/layout/main";
import { PageActions } from "@/providers/page-header-provider";
import { CreateMenuButton } from "./_components/create-menu-button";
import { Empty, Errored, Loading, Success } from "./_components/query-states";
import { VenueQrDialog } from "./_components/venue-qr-dialog";

function MenuPage() {
  const menusQuery = useGetMenus();
  const venueQuery = useGetVenue();
  const [qrOpen, setQrOpen] = useState(false);
  const venueSlug = menusQuery.data?.venueSlug;
  const venueLogo = venueQuery.data?.logo ?? null;

  return (
    <Main className="flex flex-col gap-5">
      <PageActions>
        {venueSlug && (
          <Button onClick={() => setQrOpen(true)} variant="outline">
            <QrCode className="size-4" />
            QR Code
          </Button>
        )}
        <CreateMenuButton>Nuovo menu</CreateMenuButton>
      </PageActions>
      {matchQueryStatus(menusQuery, {
        Loading,
        Errored,
        Empty,
        Success,
      })}
      {menusQuery.isFetching && !menusQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Aggiornamento menu...</p>
      ) : null}
      {venueSlug && (
        <VenueQrDialog
          onOpenChange={setQrOpen}
          open={qrOpen}
          venueLogo={venueLogo}
          venueSlug={venueSlug}
        />
      )}
    </Main>
  );
}

export default MenuPage;
