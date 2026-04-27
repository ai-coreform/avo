"use client";

import type { MenuTheme } from "@avo/menu/menu-theme";
import type {
  AiWaiterPreviewSettings,
  PreviewAiSettingsMessage,
  PreviewChatOpenMessage,
  PreviewMenuMessage,
  PreviewTabChangeMessage,
  PreviewThemeMessage,
} from "@avo/menu/preview-protocol";
import { useCallback, useEffect, useRef } from "react";
import { PUBLIC_MENU_ORIGIN } from "@/lib/public-menu-url";

interface MenuPreviewIframeProps {
  venueSlug: string;
  menuSlug: string;
  className?: string;
}

export function MenuPreviewIframe({
  venueSlug,
  menuSlug,
  className,
}: MenuPreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const src = `${PUBLIC_MENU_ORIGIN}/m/${venueSlug}/${menuSlug}?preview=true`;

  return (
    <iframe
      className={className}
      data-preview-iframe
      ref={iframeRef}
      src={src}
      title="Menu Preview"
    />
  );
}

/**
 * Hook that provides functions to send messages to the preview iframe.
 * The caller passes data; this hook handles postMessage serialization.
 */
export function usePreviewMessenger() {
  const send = useCallback(
    (
      message:
        | PreviewThemeMessage
        | PreviewMenuMessage
        | PreviewTabChangeMessage
        | PreviewChatOpenMessage
        | PreviewAiSettingsMessage
    ) => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        "[data-preview-iframe]"
      );
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, PUBLIC_MENU_ORIGIN);
      }
    },
    []
  );

  const sendTheme = useCallback(
    (theme: Partial<MenuTheme>) => {
      send({ type: "avo-preview:theme-update", theme });
    },
    [send]
  );

  const sendMenuData = useCallback(
    (data: unknown) => {
      send({ type: "avo-preview:menu-update", data });
    },
    [send]
  );

  const sendTabChange = useCallback(
    (tabSlug: string) => {
      send({ type: "avo-preview:tab-change", tabSlug });
    },
    [send]
  );

  const sendChatOpen = useCallback(
    (open: boolean) => {
      send({ type: "avo-preview:chat-open", open });
    },
    [send]
  );

  const sendAiSettings = useCallback(
    (settings: AiWaiterPreviewSettings) => {
      send({ type: "avo-preview:ai-settings-update", settings });
    },
    [send]
  );

  return {
    sendTheme,
    sendMenuData,
    sendTabChange,
    sendChatOpen,
    sendAiSettings,
  };
}

/**
 * Validates incoming "ready" messages came from the public menu app's origin.
 * The iframe sends `{ type: "avo-preview:ready" }` once it's mounted; we
 * use that to (re)send the current theme/data/etc.
 */
function isReadyFromPublicMenu(event: MessageEvent): boolean {
  return (
    event.origin === PUBLIC_MENU_ORIGIN &&
    !!event.data &&
    typeof event.data === "object" &&
    (event.data as { type?: unknown }).type === "avo-preview:ready"
  );
}

/**
 * Hook that sends a theme update to the iframe whenever the theme changes.
 * Also listens for "avo-preview:ready" from the iframe and resends the current theme.
 */
export function useThemePreviewSync(theme: Partial<MenuTheme> | null) {
  const { sendTheme } = usePreviewMessenger();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    if (theme) {
      sendTheme(theme);
    }
  }, [theme, sendTheme]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      if (isReadyFromPublicMenu(event) && themeRef.current) {
        sendTheme(themeRef.current);
      }
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [sendTheme]);
}

/**
 * Hook that sends a tab change to the iframe whenever the active tab changes.
 */
export function useTabPreviewSync(tabSlug: string | null) {
  const { sendTabChange } = usePreviewMessenger();

  useEffect(() => {
    if (tabSlug) {
      sendTabChange(tabSlug);
    }
  }, [tabSlug, sendTabChange]);
}

/**
 * Hook that pushes AI Waiter settings (color, questions, personality) into
 * the preview iframe. Resends on the iframe's "ready" signal so the override
 * lands even if it was queued before the public menu mounted.
 */
export function useAiSettingsPreviewSync(
  settings: AiWaiterPreviewSettings | null
) {
  const { sendAiSettings } = usePreviewMessenger();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (settings) {
      sendAiSettings(settings);
    }
  }, [settings, sendAiSettings]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      if (isReadyFromPublicMenu(event) && settingsRef.current) {
        sendAiSettings(settingsRef.current);
      }
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [sendAiSettings]);
}

/**
 * Hook that tells the iframe whether the AI chat panel should be open.
 * Resends on the iframe's "ready" signal so the chat opens reliably even
 * if the message arrives before the public menu finished mounting.
 */
export function useChatOpenPreviewSync(open: boolean | null) {
  const { sendChatOpen } = usePreviewMessenger();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (open !== null) {
      sendChatOpen(open);
    }
  }, [open, sendChatOpen]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      if (isReadyFromPublicMenu(event) && openRef.current !== null) {
        sendChatOpen(openRef.current);
      }
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [sendChatOpen]);
}

/**
 * Hook that sends a menu data update to the iframe whenever the data changes.
 * Also listens for "avo-preview:ready" from the iframe and resends the current data.
 *
 * `data` is typed as `unknown` because the dashboard fetches it from its own
 * `menusApi.getPreview` (manage endpoint) but the public menu receives it via
 * its own `PublicMenuData` type — both shapes are produced by the same backend
 * `serializePublicMenu` so the runtime payload is identical.
 */
export function useMenuDataPreviewSync(data: unknown | null) {
  const { sendMenuData } = usePreviewMessenger();
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (data) {
      sendMenuData(data);
    }
  }, [data, sendMenuData]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      if (isReadyFromPublicMenu(event) && dataRef.current) {
        sendMenuData(dataRef.current);
      }
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [sendMenuData]);
}
