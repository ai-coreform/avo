/**
 * Re-export of the canonical AI Waiter settings type from `@avo/menu`.
 * Kept as a stub so existing backend imports (`@/operations/chat/ai-waiter-types`)
 * continue to resolve unchanged, while the source of truth now lives in the
 * shared package alongside menu-theme and the preview-protocol types.
 */
export type {
  AiWaiterSettings,
  PersonalitySlug,
} from "@avo/menu/ai-waiter-settings";
