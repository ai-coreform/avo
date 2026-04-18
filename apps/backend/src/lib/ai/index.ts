import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import type { z } from "zod";
import type { ChatCompletionOptions, GenerateObjectOptions } from "./types";

export type { ChatCompletionOptions, GenerateObjectOptions } from "./types";

const DEFAULT_MODEL = "google/gemini-2.5-flash";
const DEFAULT_MAX_TOKENS = 4096;

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }
  return key;
}

let _provider: ReturnType<typeof createOpenRouter> | null = null;

function getProvider() {
  if (!_provider) {
    _provider = createOpenRouter({ apiKey: getApiKey() });
  }
  return _provider;
}

class AIServiceImpl {
  /**
   * Generate a structured object from a prompt using a Zod schema.
   * Uses Vercel AI SDK `generateObject` under the hood.
   */
  async generateObject<T extends z.ZodType>(
    options: GenerateObjectOptions<T>
  ): Promise<z.infer<T>> {
    const model = getProvider()(options.model ?? DEFAULT_MODEL);

    const generateOpts = {
      model,
      schema: options.schema,
      system: options.system,
      providerOptions: options.providerOptions,
      ...(options.messages
        ? {
            messages: options.messages as Parameters<
              typeof generateObject
            >[0]["messages"],
          }
        : { prompt: options.prompt ?? "" }),
    } as Parameters<typeof generateObject>[0];

    const result = await generateObject(generateOpts);

    return result.object as z.infer<T>;
  }

  /**
   * Raw chat completion returning the text content.
   * Uses OpenRouter's OpenAI-compatible API directly.
   */
  async chatCompletion(options: ChatCompletionOptions): Promise<string | null> {
    const apiKey = getApiKey();
    const model = options.model ?? DEFAULT_MODEL;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          messages: options.messages,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `AI chat completion failed (${response.status}): ${text}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content ?? null;
  }
}

export const aiService = new AIServiceImpl();
