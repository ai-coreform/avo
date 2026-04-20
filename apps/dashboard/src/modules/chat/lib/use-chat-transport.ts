"use client";

import { DefaultChatTransport } from "ai";
import { type RefObject, useMemo } from "react";
import { CHAT_API_PATH } from "./constants";
import { createChatFetch } from "./create-chat-fetch";

export function useChatTransport(pendingImageRef: RefObject<File | null>) {
  const customFetch = useMemo(
    () => createChatFetch(pendingImageRef),
    [pendingImageRef]
  );

  return useMemo(
    () =>
      new DefaultChatTransport({
        api: CHAT_API_PATH,
        fetch: customFetch,
      }),
    [customFetch]
  );
}
