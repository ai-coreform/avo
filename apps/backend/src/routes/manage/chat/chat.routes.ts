import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { Hono } from "hono";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { executeTool } from "@/operations/chat/execute-tool";
import { getMenuContext, getVenueName } from "@/operations/chat/menu-context";
import { transcribeAudio } from "@/operations/chat/transcribe";
import { buildSystemPrompt } from "./chat.prompt";
import { createMenuTools, isMutationToolName } from "./chat.tools";

const TRANSCRIBE_HEADER = "x-avo-transcribe";

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  const provider = createOpenRouter({ apiKey });
  return provider.chat("google/gemini-2.5-flash");
}

interface ToolUIPart {
  type: string;
  state: string;
  toolCallId: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  approval?: { id: string; approved?: boolean; reason?: string };
  [key: string]: unknown;
}

/**
 * Execute approved tool calls and inject results into the UIMessages
 * before passing to the AI SDK. This avoids MissingToolResultsError
 * that occurs when the SDK's internal approval handling fails.
 */
async function resolveApprovedToolCalls(
  messages: UIMessage[],
  venueId: string
) {
  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }
    for (let i = 0; i < message.parts.length; i++) {
      const part = message.parts[i] as ToolUIPart;
      if (
        !part.type?.startsWith("tool-") ||
        part.state !== "approval-responded"
      ) {
        continue;
      }
      const toolName = part.type.split("-").slice(1).join("-");
      if (!isMutationToolName(toolName)) {
        continue;
      }
      if (part.approval?.approved === true) {
        const result = await executeTool(
          venueId,
          toolName,
          (part.input ?? {}) as Record<string, unknown>
        );
        message.parts[i] = {
          ...part,
          type: "dynamic-tool" as const,
          toolName,
          state: "output-available",
          output: result,
        } as UIMessage["parts"][number];
      } else {
        message.parts[i] = {
          ...part,
          type: "dynamic-tool" as const,
          toolName,
          state: "output-denied",
        } as UIMessage["parts"][number];
      }
    }
  }
}

const chatRoutes = new Hono().use(requireOrgAdmin()).post("/", async (c) => {
  const member = c.get("member");
  const venueId = member.venueId;

  // Handle transcription requests
  if (c.req.header(TRANSCRIBE_HEADER) === "1") {
    const formData = await c.req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return c.json({ error: "Audio mancante" }, 400);
    }

    try {
      const text = await transcribeAudio(audio);
      return c.json({ text });
    } catch (error) {
      console.error("Transcription error:", error);
      return c.json({ error: "Trascrizione non riuscita" }, 500);
    }
  }

  // Handle chat requests
  let messages: UIMessage[];

  try {
    const body = (await c.req.json()) as { messages?: UIMessage[] };
    messages = body.messages ?? [];
  } catch {
    return c.json({ error: "Richiesta non valida" }, 400);
  }

  if (messages.length === 0) {
    return c.json({ error: "Nessun messaggio" }, 400);
  }

  const [menuContext, venueName] = await Promise.all([
    getMenuContext(venueId),
    getVenueName(venueId),
  ]);

  const tools = createMenuTools({ venueId, menuContext });
  const systemPrompt = `${buildSystemPrompt({ venueName })}\n\n${menuContext}`;

  try {
    // Pre-process approved tool calls: execute them and inject results
    // before passing to the SDK to avoid MissingToolResultsError
    await resolveApprovedToolCalls(messages, venueId);

    const modelMessages = await convertToModelMessages(messages, { tools });

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(12),
      maxOutputTokens: 2048,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Si e' verificato un errore. Riprova." }, 500);
  }
});

export { chatRoutes };
