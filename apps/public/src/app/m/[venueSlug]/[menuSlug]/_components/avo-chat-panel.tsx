"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, RotateCcw, RotateCw, X } from "lucide-react";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChatStrings } from "./chat-translations";

const DEFAULT_BG_COLOR = "#1a1a1a";
const DEFAULT_LOCALE = "it";
const MARKDOWN_LIST_ITEM_RE = /^\s*[-•*]\s+(.+)/;
const MARKDOWN_BOLD_RE = /\*\*(.+?)\*\*/;

function AvoMascot({
  size = 120,
  bgColor = DEFAULT_BG_COLOR,
}: {
  size?: number;
  bgColor?: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      {/* biome-ignore lint/performance/noImgElement: static asset */}
      {/* biome-ignore lint/correctness/useImageSize: sized via parent */}
      <img
        alt=""
        className="object-contain"
        src="/images/avo-icon-white.svg"
        style={{ width: size * 0.5, height: size * 0.6 }}
      />
    </div>
  );
}

function AvoAvatar({
  size = 32,
  bgColor = DEFAULT_BG_COLOR,
}: {
  size?: number;
  bgColor?: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        padding: size * 0.2,
        backgroundColor: bgColor,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: static asset */}
      {/* biome-ignore lint/correctness/useImageSize: sized via CSS */}
      <img
        alt=""
        className="size-full object-contain"
        src="/images/avo-icon-white.svg"
      />
    </div>
  );
}

function TypingIndicator({ bgColor }: { bgColor: string }) {
  return (
    <div className="flex items-start gap-2">
      <AvoAvatar bgColor={bgColor} size={28} />
      <div className="rounded-2xl rounded-tl-sm bg-[#f0f0f0] px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2 animate-bounce rounded-full bg-[#999] [animation-delay:0ms]" />
          <div className="size-2 animate-bounce rounded-full bg-[#999] [animation-delay:150ms]" />
          <div className="size-2 animate-bounce rounded-full bg-[#999] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

interface AvoChatPanelProps {
  venueSlug: string;
  menuSlug: string;
  onClose: () => void;
  bgColor?: string;
  /**
   * Optional override of the four welcome chip suggestions. When omitted, the
   * locale-appropriate defaults from chat-translations are used.
   */
  welcomeSuggestions?: string[];
  /** Current menu locale (e.g. "it", "en", "es"). */
  locale?: string;
  /** AI Waiter personality slug — sent to the chat backend per request. */
  personality?: string;
}

export function AvoChatPanel({
  venueSlug,
  menuSlug,
  onClose,
  bgColor = DEFAULT_BG_COLOR,
  welcomeSuggestions,
  locale = DEFAULT_LOCALE,
  personality,
}: AvoChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const strings = useMemo(() => getChatStrings(locale), [locale]);
  const suggestions = welcomeSuggestions ?? strings.defaultSuggestions;

  // Refs let the stable transport always read the latest locale/personality
  // so language switches and personality changes mid-conversation take effect
  // immediately on the next request, without recreating the transport.
  const localeRef = useRef(locale);
  const personalityRef = useRef(personality);
  localeRef.current = locale;
  personalityRef.current = personality;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/public/chat/${venueSlug}/${menuSlug}`,
        prepareSendMessagesRequest: ({ messages: msgs }) => ({
          body: {
            messages: msgs,
            locale: localeRef.current,
            personality: personalityRef.current,
          },
        }),
      }),
    [venueSlug, menuSlug]
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    regenerate,
    clearError,
  } = useChat({
    id: "public-menu-chat",
    transport,
  });

  /**
   * Map a JS error from the chat transport to the most informative localized
   * string. The backend returns coded errors for known cases (rate_limited,
   * conversation_too_long); everything else falls back to the generic copy.
   */
  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    const msg = error.message ?? "";
    if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
      return strings.error.rateLimited;
    }
    if (msg.includes("413") || msg.toLowerCase().includes("too_long")) {
      return strings.error.conversationTooLong;
    }
    return strings.error.generic;
  }, [error, strings]);

  const isBusy = status === "submitted" || status === "streaming";
  const showWelcome = messages.length === 0 && !isBusy;

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, status]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isBusy) {
        return;
      }
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      await sendMessage({ text: msg });
    },
    [input, isBusy, sendMessage]
  );

  const fireSend = useCallback(
    (text?: string) => {
      handleSend(text).catch(() => {
        // `useChat` exposes send failures through its `error` state.
      });
    },
    [handleSend]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fireSend();
      }
    },
    [fireSend]
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    setInput("");
  }, [setMessages]);

  // Extract follow-up suggestions from the last assistant message
  const followUpSuggestions = useMemo(() => {
    if (isBusy || messages.length === 0) {
      return [];
    }
    const lastMsg = messages.at(-1);
    if (!lastMsg || lastMsg.role !== "assistant") {
      return [];
    }
    return [
      strings.followUp.more,
      strings.followUp.thanks,
      strings.followUp.alternatives,
    ];
  }, [messages, isBusy, strings]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/20">
      <div className="flex h-full w-full flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="shrink-0 border-[#eee] border-b">
          <div className="mx-auto flex w-full max-w-2xl items-center px-3 py-2.5">
            <button
              aria-label={strings.closeAria}
              className="flex size-9 items-center justify-center text-[#333] transition-opacity hover:opacity-60"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>
            <div className="flex flex-1 items-center justify-center gap-2.5">
              <AvoAvatar bgColor={bgColor} size={36} />
              <div>
                <p className="font-bold text-[#333] text-[14px] leading-tight">
                  {strings.headerTitle}
                </p>
                <p className="text-[#999] text-[12px] leading-tight">
                  {strings.headerSubtitle}
                </p>
              </div>
            </div>
            <button
              aria-label={strings.newConversationAria}
              className="flex size-9 items-center justify-center text-[#999] transition-opacity hover:opacity-60"
              onClick={handleReset}
              type="button"
            >
              <RotateCw className="size-4.5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Chat body */}
        <div
          className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={scrollRef}
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-3">
            {showWelcome && (
              <div className="flex flex-col items-center px-2 pt-4 pb-2">
                <AvoMascot bgColor={bgColor} size={100} />
                <h2 className="mt-4 font-bold text-[#333] text-xl">
                  {strings.welcomeTitle}
                </h2>
                <p className="mt-1 text-center text-[#aaa] text-[13px]">
                  {strings.welcomeSubtitle}
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      className="rounded-[20px] border border-[#ddd] px-5 py-2 text-center text-[#333] text-[13px] transition-colors hover:bg-[#f5f5f5]"
                      key={suggestion}
                      onClick={() => fireSend(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
              if (message.role === "user") {
                const text = message.parts
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text"
                  )
                  .map((p) => p.text)
                  .join("");
                return (
                  <div className="mb-3 flex justify-end" key={message.id}>
                    <div
                      className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-[13px] text-white leading-relaxed"
                      style={{ backgroundColor: bgColor }}
                    >
                      {text}
                    </div>
                  </div>
                );
              }

              if (message.role === "assistant") {
                const text = message.parts
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text"
                  )
                  .map((p) => p.text)
                  .join("");
                if (!text) {
                  return null;
                }
                return (
                  <div className="mb-3 flex items-start gap-2" key={message.id}>
                    <AvoAvatar bgColor={bgColor} size={28} />
                    <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#f0f0f0] px-3.5 py-2 text-[#333] text-[13px] leading-relaxed">
                      {renderMarkdown(text)}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {status === "submitted" && <TypingIndicator bgColor={bgColor} />}

            {/* Error banner — surfaces 4xx/5xx from the chat API with a Retry. */}
            {errorMessage && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-[#f4d4d4] bg-[#fef5f5] px-3.5 py-2.5">
                <p className="flex-1 text-[#8a4040] text-[12px] leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1 font-medium text-[#8a4040] text-[11px] shadow-sm transition-colors hover:bg-[#fafafa]"
                  onClick={() => {
                    clearError();
                    regenerate().catch(() => {
                      // `useChat` exposes retry failures through its `error` state.
                    });
                  }}
                  type="button"
                >
                  <RotateCcw className="size-3" />
                  {strings.error.retry}
                </button>
              </div>
            )}

            {/* Follow-up suggestions */}
            {followUpSuggestions.length > 0 && (
              <div className="mt-1 mb-2 flex flex-wrap gap-1.5 pl-[36px]">
                {followUpSuggestions.map((s) => (
                  <button
                    className="rounded-[20px] border border-[#ddd] px-3 py-1.5 text-[#666] text-[12px] transition-colors hover:bg-[#f5f5f5]"
                    key={s}
                    onClick={() => fireSend(s)}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div
          className="shrink-0 bg-white"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto w-full max-w-2xl px-4 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fireSend();
              }}
            >
              <div
                className="flex w-full flex-col rounded-2xl border shadow-sm transition-[color,box-shadow] has-[textarea:focus-visible]:border-neutral-400 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-neutral-300/50"
                style={{ borderColor: "#E0E0E0", backgroundColor: "#FFFFFF" }}
              >
                <textarea
                  className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 font-sans text-base outline-none"
                  disabled={isBusy}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={strings.placeholder}
                  ref={textareaRef}
                  rows={1}
                  style={{ color: "#1A1A1A" }}
                  value={input}
                />
                <div className="flex items-center justify-end gap-2 px-2 pt-0 pb-2">
                  <button
                    aria-label={strings.sendAria}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!input.trim() || isBusy}
                    onClick={() => fireSend()}
                    style={{ backgroundColor: "#1A1A1A" }}
                    type="submit"
                  >
                    <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </form>
            <p
              className="mt-1.5 pb-0.5 text-center font-sans text-[11px]"
              style={{ color: "rgba(26, 26, 26, 0.35)" }}
            >
              {strings.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders simple markdown (bold, italic, lists) as React elements.
 */
function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) {
      return;
    }
    elements.push(
      <ul className="my-1 list-disc pl-5" key={key++}>
        {listItems.map((item, i) => (
          <li key={i}>{inlineFormat(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const listMatch = line.match(MARKDOWN_LIST_ITEM_RE);
    if (listMatch) {
      listItems.push(listMatch[1]);
    } else {
      flushList();
      if (line.trim()) {
        elements.push(
          <span key={key++}>
            {inlineFormat(line)}
            {"\n"}
          </span>
        );
      } else {
        elements.push(<br key={key++} />);
      }
    }
  }
  flushList();

  return elements;
}

function inlineFormat(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(MARKDOWN_BOLD_RE);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : parts;
}
