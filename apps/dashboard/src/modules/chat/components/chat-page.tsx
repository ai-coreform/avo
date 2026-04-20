"use client";

import { ChatContent } from "./chat-content";

export function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <ChatContent />
    </div>
  );
}
