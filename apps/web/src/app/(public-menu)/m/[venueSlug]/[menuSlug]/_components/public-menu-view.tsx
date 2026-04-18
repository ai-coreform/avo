"use client";

import { useSearchParams } from "next/navigation";
import type { PublicMenuData } from "@/api/public-menu/types";
import { useGetPublicMenu } from "@/api/public-menu/use-get-public-menu";
import { matchQueryStatus } from "@/lib/match-query-status";
import { usePreviewMode } from "../_hooks/use-preview-mode";
import { MenuShell } from "./menu-shell";
import { PublicMenuErrored } from "./public-menu-errored";
import { PublicMenuLoading } from "./public-menu-loading";

function PublicMenuSuccess({ data }: { data: PublicMenuData }) {
  return <MenuShell data={data} themeOverride={null} />;
}

interface PublicMenuViewProps {
  venueSlug: string;
  menuSlug: string;
}

export function PublicMenuView({ venueSlug, menuSlug }: PublicMenuViewProps) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  const query = useGetPublicMenu(venueSlug, menuSlug, {
    enabled: !isPreview,
  });
  const { themeOverride, menuOverride, tabSlugOverride } =
    usePreviewMode(isPreview);

  // In preview mode, render as soon as we get data from postMessage
  if (isPreview) {
    if (menuOverride) {
      return (
        <MenuShell
          data={menuOverride}
          tabSlugOverride={tabSlugOverride}
          themeOverride={themeOverride}
        />
      );
    }
    return <PublicMenuLoading />;
  }

  return matchQueryStatus(query, {
    Loading: <PublicMenuLoading />,
    Errored: ({ error }) => <PublicMenuErrored error={error} />,
    Empty: <PublicMenuLoading />,
    Success: PublicMenuSuccess,
  });
}
