"use client";

import { useGetMenuEditor } from "@/api/menu/use-get-menu-editor";
import { matchQueryStatus } from "@/lib/match-query-status";
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
