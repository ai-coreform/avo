import type { UIMessage } from "ai";

/**
 * Compacts messages before sending to the API to reduce token usage.
 * Currently a pass-through — can be extended to strip large tool outputs.
 */
export function compactMessages(messages: UIMessage[]): UIMessage[] {
  return messages;
}
