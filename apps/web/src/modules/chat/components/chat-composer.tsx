import { Button } from "@avo/ui/components/ui/button";
import { Input } from "@avo/ui/components/ui/input";
import { ArrowUp, Loader2, Mic, Paperclip, Trash2, X } from "lucide-react";
import type { RefObject } from "react";
import { formatRecordingDuration } from "../lib/format-duration";

export interface ChatComposerProps {
  imagePreviewUrl: string | null;
  onClearAttachedImage: () => void;
  isRecording: boolean;
  recordingDuration: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onCancelRecording: () => void;
  onSendRecording: () => void;
  onStartRecording: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
  isBusy: boolean;
  isTranscribing: boolean;
  hasAttachedImage: boolean;
  onSend: () => void;
}

export function ChatComposer({
  imagePreviewUrl,
  onClearAttachedImage,
  isRecording,
  recordingDuration,
  canvasRef,
  onCancelRecording,
  onSendRecording,
  onStartRecording,
  fileInputRef,
  onImageSelect,
  inputRef,
  input,
  onInputChange,
  onInputKeyDown,
  isBusy,
  isTranscribing,
  hasAttachedImage,
  onSend,
}: ChatComposerProps) {
  return (
    <div className="flex-shrink-0 border-border border-t bg-card px-4 py-3">
      {imagePreviewUrl && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative">
            {/* biome-ignore lint/performance/noImgElement: image preview */}
            {/* biome-ignore lint/correctness/useImageSize: dynamic preview */}
            <img
              alt="Anteprima"
              className="h-16 w-auto rounded-lg border border-border"
              src={imagePreviewUrl}
            />
            <button
              className="absolute -top-1.5 -right-1.5 rounded-full bg-muted-foreground p-0.5 text-white hover:bg-foreground"
              onClick={onClearAttachedImage}
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      {isRecording ? (
        <div className="flex items-center gap-2">
          <Button
            className="size-11 flex-shrink-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onCancelRecording}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="size-5" />
          </Button>
          <div className="flex flex-1 items-center gap-3 overflow-hidden rounded-full border border-primary/20 bg-background px-4">
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="size-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="w-10 font-medium text-foreground text-sm tabular-nums">
                {formatRecordingDuration(recordingDuration)}
              </span>
            </div>
            <canvas className="h-8 flex-1" ref={canvasRef} />
          </div>
          <Button
            className="size-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSendRecording}
            size="icon"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            className="size-11 flex-shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
            disabled={isBusy}
            onClick={() => onStartRecording()}
            size="icon"
            variant="ghost"
          >
            <Mic className="size-5" />
          </Button>
          <Button
            className="size-11 flex-shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            variant="ghost"
          >
            <Paperclip className="size-5" />
          </Button>
          <input
            accept="image/*"
            className="hidden"
            onChange={onImageSelect}
            ref={fileInputRef}
            type="file"
          />
          <Input
            className="flex-1 rounded-full border-border"
            disabled={isBusy}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Scrivi un messaggio..."
            ref={inputRef}
            type="text"
            value={input}
          />
          <Button
            aria-busy={isTranscribing}
            className="size-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!(input.trim() || hasAttachedImage) || isBusy}
            onClick={onSend}
            size="icon"
          >
            {isTranscribing ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                <span className="sr-only">Trascrizione in corso...</span>
              </>
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
