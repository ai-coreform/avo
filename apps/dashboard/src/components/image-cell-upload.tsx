"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@avo/ui/components/ui/tooltip";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import { filesApi } from "@/api/files";
import { API_BASE_URL } from "@/config/environment";

interface ImageCellUploadProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith("http")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

function ImageCellContent({
  isUploading,
  resolvedUrl,
}: {
  isUploading: boolean;
  resolvedUrl: string | null;
}) {
  if (isUploading) {
    return (
      <div className="flex size-full items-center justify-center bg-muted">
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resolvedUrl) {
    return (
      <>
        {/* biome-ignore lint/performance/noImgElement: dynamic uploaded images */}
        {/* biome-ignore lint/correctness/useImageSize: sized via parent */}
        <img alt="" className="size-full object-cover" src={resolvedUrl} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
          <Upload className="size-3 text-white" />
        </div>
      </>
    );
  }

  return (
    <div className="flex size-full items-center justify-center bg-muted transition-colors group-hover/img:bg-muted">
      <ImageIcon className="size-3.5 text-border group-hover/img:hidden" />
      <Upload className="hidden size-3.5 text-muted-foreground group-hover/img:block" />
    </div>
  );
}

export function ImageCellUpload({
  value,
  onChange,
  disabled = false,
}: ImageCellUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedUrl = previewUrl || resolveImageUrl(value);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      event.target.value = "";

      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsUploading(true);

      try {
        const result = await filesApi.upload(file);
        onChange(result.url);
      } catch (error) {
        console.error("Upload failed:", error);
        setPreviewUrl(null);
      } finally {
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(null);
        setIsUploading(false);
      }
    },
    [onChange]
  );

  return (
    <>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      <div className="group/cell relative size-8 shrink-0">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                className="group/img relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border transition-all hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                disabled={disabled || isUploading}
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <ImageCellContent
                  isUploading={isUploading}
                  resolvedUrl={resolvedUrl}
                />
              </button>
            </TooltipTrigger>

            <TooltipContent
              className="rounded-lg bg-foreground px-2.5 py-1.5 font-sans text-primary-foreground text-xs"
              side="bottom"
              sideOffset={6}
            >
              {resolvedUrl ? "Sostituisci immagine" : "Carica immagine"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {resolvedUrl && !isUploading && !disabled && (
          <button
            aria-label="Rimuovi immagine"
            className="absolute -top-1.5 -right-1.5 z-10 flex size-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-muted hover:text-foreground group-hover/cell:opacity-100"
            onClick={() => onChange(null)}
            type="button"
          >
            <X className="size-2.5" />
          </button>
        )}
      </div>
    </>
  );
}
