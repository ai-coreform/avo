"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PublicMenuData } from "@/api/public-menu/types";
import type {
  PreviewMenuMessage,
  PreviewTabChangeMessage,
  PreviewThemeMessage,
} from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_hooks/use-preview-mode";
import type { MenuTheme } from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_utils/menu-theme";

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

  const src = `/m/${venueSlug}/${menuSlug}?preview=true`;

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
    ) => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        "[data-preview-iframe]"
      );
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
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
    (data: PublicMenuData) => {
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

  return { sendTheme, sendMenuData, sendTabChange };
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
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "avo-preview:ready" &&
        themeRef.current
      ) {
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
 * Hook that sends a menu data update to the iframe whenever the data changes.
 * Also listens for "avo-preview:ready" from the iframe and resends the current data.
 */
export function useMenuDataPreviewSync(data: PublicMenuData | null) {
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
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "avo-preview:ready" &&
        dataRef.current
      ) {
        sendMenuData(dataRef.current);
      }
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [sendMenuData]);
}
