import { type ChatStatus, getToolName, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { sanitizeContent } from "../lib/sanitize-content";
import { ChatImageLightbox } from "./chat-image-lightbox";
import { ChatSuggestions } from "./chat-suggestions";
import { ChatToolPart } from "./chat-tool-part";
import { ChatTypingIndicator } from "./chat-typing-indicator";

type AddApproval = (args: {
  id: string;
  approved: boolean;
  reason?: string;
}) => void | PromiseLike<void>;

interface ChatMessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  isBusy: boolean;
  showSuggestions: boolean;
  showTypingIndicator: boolean;
  onSuggestionPick: (text: string) => void;
  addToolApprovalResponse: AddApproval;
}

export function ChatMessageList({
  messages,
  status,
  isBusy,
  showSuggestions,
  showTypingIndicator,
  onSuggestionPick,
  addToolApprovalResponse,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastIndex = messages.length - 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
      {messages.map((msg, msgIndex) => {
        const isLastAssistant =
          msg.role === "assistant" && msgIndex === lastIndex;

        return (
          <div
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            key={msg.id}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === "user"
                  ? "rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-foreground"
                  : "text-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <div>
                  {msg.parts.map((part) => {
                    if (part.type === "text") {
                      return (
                        <p
                          className="whitespace-pre-wrap text-base"
                          key={part.text}
                        >
                          {part.text}
                        </p>
                      );
                    }
                    if (part.type === "file" && "url" in part && part.url) {
                      return (
                        <div
                          className="mb-2 overflow-hidden rounded-lg"
                          key={part.url}
                        >
                          <ChatImageLightbox
                            alt="Allegato"
                            src={part.url}
                            trigger={
                              /* biome-ignore lint/performance/noImgElement: chat attachment */
                              /* biome-ignore lint/correctness/useImageSize: dynamic image */
                              <img
                                alt="Allegato"
                                className="max-h-32 w-auto rounded-lg"
                                src={part.url}
                              />
                            }
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {msg.parts.map((part, pi) => {
                    if (part.type === "text") {
                      return (
                        <div
                          className="chat-markdown text-base"
                          key={part.text}
                        >
                          <Streamdown
                            isAnimating={
                              part.state === "streaming" &&
                              isLastAssistant &&
                              status === "streaming"
                            }
                          >
                            {sanitizeContent(part.text)}
                          </Streamdown>
                        </div>
                      );
                    }

                    if (!isToolUIPart(part)) {
                      return null;
                    }

                    const toolName = getToolName(part);

                    return (
                      <ChatToolPart
                        addToolApprovalResponse={addToolApprovalResponse}
                        isBusy={isBusy}
                        key={part.toolCallId}
                        part={part}
                        partIndex={pi}
                        toolName={toolName}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showSuggestions && (
        <ChatSuggestions onPick={(s) => onSuggestionPick(s)} />
      )}

      {showTypingIndicator && <ChatTypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
