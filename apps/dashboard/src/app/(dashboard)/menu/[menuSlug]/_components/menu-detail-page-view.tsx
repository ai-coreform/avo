"use client";

import { matchQueryStatus } from "@avo/ui/lib/match-query-status";
import { useGetMenuEditor } from "@/api/menu/use-get-menu-editor";
import { MenuEditorScreen } from "./menu-editor-screen";
import { Empty, Errored, Loading } from "./query-states";

interface MenuDetailPageViewProps {
  menuSlug: string;
}

export function MenuDetailPageView({ menuSlug }: MenuDetailPageViewProps) {
  const menuEditorQuery = useGetMenuEditor(menuSlug);

  return matchQueryStatus(menuEditorQuery, {
    Loading,
    Errored,
    Empty,
    Success: ({ data }) => (
      <MenuEditorScreen
        data={data}
        menuSlug={menuSlug}
        venueLogo={data.venueLogo ?? null}
        venueName={data.venueName ?? null}
        venueSlug={data.venueSlug ?? null}
      />
    ),
  });
}
