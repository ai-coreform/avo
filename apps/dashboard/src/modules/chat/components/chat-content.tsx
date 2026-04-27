"use client";

import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { appendAssistantTextMessage } from "../lib/append-assistant-message";
import { MAX_IMAGE_BYTES } from "../lib/constants";
import { ChatUnauthorizedError } from "../lib/transcribe-audio";
import { useChatTransport } from "../lib/use-chat-transport";
import { useTranscribeMutation } from "../lib/use-transcribe-mutation";
import { useVoiceRecording } from "../lib/use-voice-recording";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";

export function ChatContent() {
  const pendingImageRef = useRef<File | null>(null);
  const transport = useChatTransport(pendingImageRef);
  const transcribeMutation = useTranscribeMutation();

  const {
    messages,
    sendMessage,
    setMessages,
    addToolApprovalResponse,
    status,
    error,
  } = useChat({
    id: "admin-menu-chat",
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (err) => {
      console.error(err);
      toast.error("Si e' verificato un errore. Riprova.");
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Si e' verificato un errore. Riprova.");
    }
  }, [error]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy =
    status === "submitted" ||
    status === "streaming" ||
    transcribeMutation.isPending;

  const sendAudioMessage = useCallback(
    async (audioBlob: Blob) => {
      if (status === "submitted" || status === "streaming") {
        return;
      }
      try {
        const text = await transcribeMutation.mutateAsync(audioBlob);
        await sendMessage({ text });
      } catch (e) {
        if (e instanceof ChatUnauthorizedError) {
          return;
        }
        toast.error("Non sono riuscito a trascrivere il messaggio. Riprova.");
      }
    },
    [status, sendMessage, transcribeMutation]
  );

  const onMicPermissionDenied = useCallback(() => {
    appendAssistantTextMessage(
      setMessages,
      "Non riesco ad accedere al microfono. Controlla i permessi del browser."
    );
  }, [setMessages]);

  const {
    isRecording,
    recordingDuration,
    canvasRef,
    startRecording,
    sendRecording,
    cancelRecording,
  } = useVoiceRecording({
    onBlobReady: sendAudioMessage,
    onPermissionDenied: onMicPermissionDenied,
  });

  function clearAttachedImage() {
    setAttachedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      appendAssistantTextMessage(
        setMessages,
        "L'immagine e' troppo grande. Massimo 5MB."
      );
      return;
    }
    setAttachedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function submitText(visible: string) {
    if (!(visible.trim() || attachedImage) || isBusy) {
      return;
    }
    const textToSend =
      visible.trim() || (attachedImage ? "Immagine allegata" : "");
    const img = attachedImage;
    if (img) {
      pendingImageRef.current = img;
    }
    setInput("");
    clearAttachedImage();

    try {
      await sendMessage({ text: textToSend });
    } catch {
      setInput(visible);
      if (img) {
        setAttachedImage(img);
        setImagePreviewUrl(URL.createObjectURL(img));
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitText(input).catch(() => {
        // Errors handled internally
      });
    }
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const showSuggestions = userMessageCount === 0 && !isBusy;
  const showTypingIndicator = status === "submitted";

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatMessageList
        addToolApprovalResponse={addToolApprovalResponse}
        isBusy={isBusy}
        messages={messages}
        onSuggestionPick={(s) => {
          submitText(s).catch(() => {
            // Errors handled internally
          });
        }}
        showSuggestions={showSuggestions}
        showTypingIndicator={showTypingIndicator}
        status={status}
      />

      <ChatComposer
        canvasRef={canvasRef}
        fileInputRef={fileInputRef}
        hasAttachedImage={!!attachedImage}
        imagePreviewUrl={imagePreviewUrl}
        input={input}
        inputRef={inputRef}
        isBusy={isBusy}
        isRecording={isRecording}
        isTranscribing={transcribeMutation.isPending}
        onCancelRecording={cancelRecording}
        onClearAttachedImage={clearAttachedImage}
        onImageSelect={handleImageSelect}
        onInputChange={setInput}
        onInputKeyDown={handleKeyDown}
        onSend={() => {
          submitText(input).catch(() => {
            // Errors handled internally
          });
        }}
        onSendRecording={sendRecording}
        onStartRecording={startRecording}
        recordingDuration={recordingDuration}
      />
    </div>
  );
}
