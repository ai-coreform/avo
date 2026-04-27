/**
 * PostMessage protocol between the dashboard (parent) and the public menu
 * iframe. Lives in `@avo/menu` so both apps can share the message contract
 * without one depending on the other.
 *
 * The dashboard SENDS messages of these types via `iframe.contentWindow.postMessage`.
 * The public menu's `usePreviewMode` hook RECEIVES and routes them.
 *
 * The iframe also emits a single bootstrap message back: `{ type: "avo-preview:ready" }`.
 */

import type { AiWaiterSettings } from "./ai-waiter-settings";
import type { MenuTheme } from "./menu-theme";

export interface PreviewThemeMessage {
  type: "avo-preview:theme-update";
  theme: Partial<MenuTheme>;
}

export interface PreviewMenuMessage {
  type: "avo-preview:menu-update";
  /**
   * Full public menu payload. Typed as `unknown` because the runtime shape is
   * Hono-RPC-inferred separately on each side (dashboard's preview endpoint
   * vs. the public endpoint), and both flow through the same backend
   * `serializePublicMenu` so the runtime data is identical. Consumers cast
   * to their local `PublicMenuData` type.
   */
  data: unknown;
}

export interface PreviewTabChangeMessage {
  type: "avo-preview:tab-change";
  tabSlug: string;
}

export interface PreviewChatOpenMessage {
  type: "avo-preview:chat-open";
  open: boolean;
}

/**
 * Subset of {@link AiWaiterSettings} that the dashboard's live-preview channel
 * actually pushes — only the fields whose effects are visible client-side
 * (color, welcome chips, personality). Sensitive settings (owner instructions,
 * promotions, pairings, custom guardrails) are NEVER sent over postMessage —
 * they live in DB and are read server-side by the chat backend only.
 */
export type AiWaiterPreviewSettings = Pick<
  AiWaiterSettings,
  "bgColor" | "questions" | "personality"
>;

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

/** Bootstrap message the iframe posts back to the parent on mount. */
export interface PreviewReadyMessage {
  type: "avo-preview:ready";
}

export type { PersonalitySlug } from "./ai-waiter-settings";
