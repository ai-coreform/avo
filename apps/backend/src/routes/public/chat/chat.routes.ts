import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";
import { chatRateLimit } from "@/middleware/chat-rate-limit";
import type { AiWaiterSettings } from "@/operations/chat/ai-waiter-types";
import {
  composeSystemPrompt,
  SYSTEM_PROMPT_VERSION,
} from "@/operations/chat/compose-system-prompt";
import { getMenuContext } from "@/operations/chat/menu-context";

/** Hard ceiling on per-request conversation length. Prevents unbounded growth
 *  in token cost (and accidental denial-of-wallet via runaway clients). */
const MAX_MESSAGES_PER_REQUEST = 30;

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  const provider = createOpenRouter({ apiKey });
  return provider.chat("google/gemini-2.5-flash");
}

interface ChatRequestBody {
  messages?: UIMessage[];
  /** ISO 639-1 locale code from the public menu's current language. */
  locale?: string;
  /**
   * Personality override — used by the dashboard's live preview iframe so
   * admins see the chosen voice without saving first. ONLY personality is
   * accepted from the body; sensitive fields (owner instructions, promotions,
   * pairings, custom guardrails) are read exclusively from the venue row.
   */
  personality?: string;
}

const publicChatRoutes = new Hono().post(
  "/:venueSlug/:menuSlug",
  chatRateLimit(),
  async (c) => {
    const startedAt = Date.now();
    const { venueSlug, menuSlug } = c.req.param();

    let body: ChatRequestBody;
    try {
      body = (await c.req.json()) as ChatRequestBody;
    } catch {
      return c.json({ error: "Richiesta non valida" }, 400);
    }

    const messages = body.messages ?? [];
    if (messages.length === 0) {
      return c.json({ error: "Nessun messaggio" }, 400);
    }
    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return c.json(
        {
          error: {
            code: "conversation_too_long",
            message:
              "La conversazione è diventata troppo lunga. Inizia una nuova conversazione.",
          },
        },
        413
      );
    }

    const locale = typeof body.locale === "string" ? body.locale : "it";

    const [venueRow] = await database
      .select({ id: venue.id, name: venue.name, aiSettings: venue.aiSettings })
      .from(venue)
      .where(eq(venue.slug, venueSlug))
      .limit(1);

    if (!venueRow) {
      return c.json({ error: "Venue non trovato" }, 404);
    }

    const [menuRow] = await database
      .select({ id: menu.id })
      .from(menu)
      .where(eq(menu.slug, menuSlug))
      .limit(1);

    if (!menuRow) {
      return c.json({ error: "Menu non trovato" }, 404);
    }

    const menuContext = await getMenuContext(venueRow.id);

    // Merge: DB is the source of truth for sensitive fields. Body can ONLY
    // override `personality` — preview-mode convenience, low blast radius
    // (voice change only, no menu data manipulation).
    const settings: AiWaiterSettings = {
      ...venueRow.aiSettings,
      ...(typeof body.personality === "string" && body.personality.length > 0
        ? { personality: body.personality as AiWaiterSettings["personality"] }
        : {}),
    };

    const systemPrompt = composeSystemPrompt({
      venueName: venueRow.name,
      locale,
      menuContext,
      settings,
    });

    try {
      const modelMessages = await convertToModelMessages(messages);

      const result = streamText({
        model: getModel(),
        system: systemPrompt,
        messages: modelMessages,
        maxOutputTokens: 1024,
        onFinish: ({ usage, finishReason }) => {
          // Structured telemetry for cost monitoring + per-venue analytics.
          // Same JSON-line shape as partner-request-logger so log aggregators
          // (Railway, Datadog, etc.) parse uniformly.
          console.info(
            JSON.stringify({
              level: "info",
              event: "ai_waiter_chat",
              venue_slug: venueSlug,
              menu_slug: menuSlug,
              locale,
              personality: settings.personality ?? "natural",
              prompt_version: SYSTEM_PROMPT_VERSION,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
              total_tokens: usage.totalTokens,
              finish_reason: finishReason,
              latency_ms: Date.now() - startedAt,
              timestamp: new Date().toISOString(),
            })
          );
        },
      });

      return result.toUIMessageStreamResponse({
        originalMessages: messages,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "ai_waiter_chat_error",
          venue_slug: venueSlug,
          menu_slug: menuSlug,
          locale,
          personality: settings.personality ?? "natural",
          prompt_version: SYSTEM_PROMPT_VERSION,
          latency_ms: Date.now() - startedAt,
          error_message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })
      );
      return c.json({ error: "Si e' verificato un errore. Riprova." }, 500);
    }
  }
);

export { publicChatRoutes };
