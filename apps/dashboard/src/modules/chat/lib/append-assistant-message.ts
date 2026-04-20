import type { UIMessage } from "ai";
import type { Dispatch, SetStateAction } from "react";

export function appendAssistantTextMessage(
  setMessages: Dispatch<SetStateAction<UIMessage[]>>,
  text: string
): void {
  setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      role: "assistant",
      parts: [{ type: "text", text, state: "done" }],
    },
  ]);
}
