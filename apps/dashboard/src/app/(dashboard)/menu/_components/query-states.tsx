import type { MenuListItem } from "@/api/menu/types";
import { EmptyState } from "@/components/states/empty-state";
import { QueryErrorState } from "@/components/states/query-error-state";
import { CreateMenuButton } from "./create-menu-button";
import { MenusGrid } from "./menus-grid";
import { MenusGridSkeleton } from "./menus-grid-skeleton";

export function Errored({ error }: { error: Error }) {
  return (
    <QueryErrorState
      error={error}
      title="Non siamo riusciti a caricare i menu"
    />
  );
}

export function Loading() {
  return <MenusGridSkeleton />;
}

export function Empty() {
  return (
    <EmptyState
      action={<CreateMenuButton>Crea il primo menu</CreateMenuButton>}
      description="Inizia creando il primo menu del locale. Potrai poi aggiungere categorie, prodotti e promozioni."
      title="Nessun menu creato"
    />
  );
}

export function Success({
  data,
}: {
  data: {
    menus: MenuListItem[];
    venueSlug: string | null;
    activeMenuId: string | null;
  };
}) {
  if (data.menus.length === 0) {
    return <Empty />;
  }

  return (
    <MenusGrid
      activeMenuId={data.activeMenuId}
      menus={data.menus}
      venueSlug={data.venueSlug}
    />
  );
}
