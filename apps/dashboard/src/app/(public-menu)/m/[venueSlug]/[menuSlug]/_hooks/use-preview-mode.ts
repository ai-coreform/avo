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

export interface PreviewChatOpenMessage {
  type: "avo-preview:chat-open";
  open: boolean;
}

/** Live-preview payload for the AI Waiter admin page. */
export interface AiWaiterPreviewSettings {
  bgColor?: string;
  questions?: string[];
  /** Forward-compat: chat backend doesn't yet branch on personality. */
  personality?: string;
}

export interface PreviewAiSettingsMessage {
  type: "avo-preview:ai-settings-update";
  settings: AiWaiterPreviewSettings;
}

export type PreviewMessage =
  | PreviewThemeMessage
  | PreviewMenuMessage
  | PreviewTabChangeMessage
  | PreviewChatOpenMessage
  | PreviewAiSettingsMessage;

export function usePreviewMode(isPreview: boolean) {
  const [themeOverride, setThemeOverride] = useState<Partial<MenuTheme> | null>(
    null
  );
  const [menuOverride, setMenuOverride] = useState<PublicMenuData | null>(null);
  const [tabSlugOverride, setTabSlugOverride] = useState<string | null>(null);
  const [chatOpenOverride, setChatOpenOverride] = useState<boolean | null>(
    null
  );
  const [aiSettingsOverride, setAiSettingsOverride] =
    useState<AiWaiterPreviewSettings | null>(null);
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
      case "avo-preview:chat-open":
        setChatOpenOverride(msg.open);
        break;
      case "avo-preview:ai-settings-update":
        setAiSettingsOverride(msg.settings);
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

  return {
    themeOverride,
    menuOverride,
    tabSlugOverride,
    chatOpenOverride,
    aiSettingsOverride,
  };
}
