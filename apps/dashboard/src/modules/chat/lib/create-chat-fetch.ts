import type { UIMessage } from "ai";
import type { RefObject } from "react";
import { compactMessages } from "./compact-messages";

interface ChatRequestJson {
  messages?: UIMessage[];
  id?: string;
  trigger?: string;
  messageId?: string;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return String(input);
}

/**
 * Creates a custom fetch function that:
 * - Compacts messages to reduce token usage
 * - Attaches pending images as multipart FormData
 * - Passes credentials for auth cookies
 */
export function createChatFetch(
  pendingImageRef: RefObject<File | null>
): typeof fetch {
  return (input, init) => {
    const rawBody = init?.body;
    if (typeof rawBody !== "string") {
      return fetch(input, init);
    }

    let json: ChatRequestJson;
    try {
      json = JSON.parse(rawBody) as ChatRequestJson;
    } catch {
      return fetch(input, init);
    }

    const url = resolveUrl(input);
    const image = pendingImageRef.current;
    pendingImageRef.current = null;
    const compactedMessages = compactMessages(json.messages ?? []);

    if (!image) {
      return fetch(url, {
        ...init,
        body: JSON.stringify({
          ...json,
          messages: compactedMessages,
        }),
        headers: {
          ...(init?.headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    }

    const fd = new FormData();
    fd.append("messages", JSON.stringify(compactedMessages));
    if (json.id != null) {
      fd.append("id", String(json.id));
    }
    fd.append("image", image);

    return fetch(url, {
      method: "POST",
      body: fd,
      credentials: "include",
      signal: init?.signal,
    });
  };
}
