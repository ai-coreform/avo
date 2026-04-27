/**
 * Shared shape for AI Waiter persisted settings. Imported by:
 * - the venue Drizzle schema (typing the JSONB column)
 * - the prompt composer (consuming it)
 * - the venue PATCH route (validating partial updates)
 *
 * All fields are optional — venues without explicit configuration fall back
 * to safe defaults at every consumer (composer, public menu, dashboard form).
 */

import type { PersonalitySlug } from "./personality-presets";

export interface AiWaiterSettings {
  /** FAB + chat avatar background. Defaults to #1A1A1A when unset. */
  bgColor?: string;
  /**
   * Custom welcome chip suggestions. Length is enforced to 4 by the dashboard
   * form. When undefined the chat panel falls back to locale-translated
   * defaults from chat-translations.ts — the right behavior for international
   * venues that haven't customized.
   */
  questions?: string[];
  /** AI voice preset. Defaults to "natural" when unset. */
  personality?: PersonalitySlug;

  // ---- Forward-compat slots ----
  // Wired through the type today so the composer signature is stable, but no
  // dashboard surface writes them yet. Adding any of these later is one new
  // section function in compose-system-prompt.ts plus one form input.
  ownerInstructions?: string;
  promotions?: {
    pushItemNames?: string[];
    customMessage?: string;
  };
  pairings?: {
    enabled?: boolean;
    customRules?: { when: string; suggest: string }[];
  };
  guardrails?: {
    requireMentions?: string[];
    avoidWords?: string[];
  };
}
