"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicMenuData } from "@/api/public-menu/types";
import type { MenuTheme } from "../_utils/menu-theme";

/**
 * PostMessage protocol for preview mode.
 *
 * The dashboard (parent) sends messages to the public menu iframe.
 * Supported message types:
 * - `theme-update`: Override the theme (partial or full).
 * - `menu-update`: Override the full menu data tree.
 */
export interface PreviewThemeMessage {
  type: "avo-preview:theme-update";
  theme: Partial<MenuTheme>;
}

export interface PreviewMenuMessage {
  type: "avo-preview:menu-update";
  data: PublicMenuData;
}

export interface PreviewTabChangeMessage {
  type: "avo-preview:tab-change";
  tabSlug: string;
}

export type PreviewMessage =
  | PreviewThemeMessage
  | PreviewMenuMessage
  | PreviewTabChangeMessage;

export function usePreviewMode(isPreview: boolean) {
  const [themeOverride, setThemeOverride] = useState<Partial<MenuTheme> | null>(
    null
  );
  const [menuOverride, setMenuOverride] = useState<PublicMenuData | null>(null);
  const [tabSlugOverride, setTabSlugOverride] = useState<string | null>(null);
  const isPreviewRef = useRef(isPreview);
  isPreviewRef.current = isPreview;

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isPreviewRef.current) {
      return;
    }

    const msg = event.data as PreviewMessage;
    if (!msg || typeof msg !== "object" || !("type" in msg)) {
      return;
    }

    switch (msg.type) {
      case "avo-preview:theme-update":
        setThemeOverride(msg.theme);
        break;
      case "avo-preview:menu-update":
        setMenuOverride(msg.data);
        break;
      case "avo-preview:tab-change":
        setTabSlugOverride(msg.tabSlug);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!isPreview) {
      return;
    }

    window.addEventListener("message", handleMessage);

    // Tell the parent we're ready to receive data
    window.parent.postMessage({ type: "avo-preview:ready" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, [isPreview, handleMessage]);

  return { themeOverride, menuOverride, tabSlugOverride };
}
