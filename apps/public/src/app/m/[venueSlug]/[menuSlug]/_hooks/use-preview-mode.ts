"use client";

import type { MenuTheme } from "@avo/menu/menu-theme";
import type {
  AiWaiterPreviewSettings,
  PreviewMessage,
} from "@avo/menu/preview-protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicMenuData } from "@/api/public-menu/types";

/**
 * Origin of the dashboard app — used to:
 * - validate incoming postMessage events (only act on messages from the
 *   dashboard, ignore everything else)
 * - target the parent when sending the "ready" handshake back
 *
 * Defaults to localhost:3000 in dev; set NEXT_PUBLIC_DASHBOARD_URL in prod
 * (e.g. "https://app.avomenu.com").
 */
const DASHBOARD_ORIGIN =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";

/**
 * Receives postMessage events from the dashboard's preview iframe parent and
 * exposes them as React state. The protocol's message types live in
 * `@avo/menu/preview-protocol` so both the dashboard sender and this receiver
 * share one source of truth.
 */
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

    // Cross-origin defense: only act on messages that came from the dashboard.
    // Anything else (rogue iframes, browser extensions, other tabs) is ignored.
    if (event.origin !== DASHBOARD_ORIGIN) {
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
        // Cast: protocol types `data` as `unknown` so neither app owns the
        // canonical menu data type. The runtime payload is identical to what
        // our own public menu endpoint returns (same backend serializer).
        setMenuOverride(msg.data as PublicMenuData);
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

    // Tell the parent we're ready to receive data — targeted at the dashboard
    // origin so the message can't leak to a malicious page that happens to
    // embed us.
    window.parent.postMessage({ type: "avo-preview:ready" }, DASHBOARD_ORIGIN);

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
