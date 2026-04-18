import type { z } from "zod";

export interface GenerateObjectOptions<T extends z.ZodType> {
  /** Model ID (e.g. "google/gemini-2.5-flash"). Falls back to env default. */
  model?: string;
  schema: T;
  system?: string;
  prompt?: string;
  messages?: Array<{
    role: "user" | "assistant" | "system";
    content: string | MessagePart[];
  }>;
  /** Extra provider options (e.g. OpenRouter plugins). */
  providerOptions?: Record<string, unknown>;
}

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }
  | {
      type: "file";
      data: string | Uint8Array;
      mediaType: string;
      filename?: string;
    };

export interface ChatCompletionOptions {
  /** Model ID (e.g. "google/gemini-2.5-flash"). Falls back to env default. */
  model?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  maxTokens?: number;
}
