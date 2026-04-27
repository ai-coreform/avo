"use client";

import { Button } from "@avo/ui/components/ui/button";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import { filesApi } from "@/api/files";
import { API_BASE_URL } from "@/config/environment";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
  /** Width/height classes for the container, defaults to "size-24" */
  sizeClassName?: string;
  /** Placeholder text shown when no image */
  placeholder?: string;
  /** Shape of the preview */
  shape?: "square" | "circle";
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

export function ImageUpload({
  value,
  onChange,
  className,
  sizeClassName = "size-24",
  placeholder = "Carica immagine",
  shape = "square",
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedUrl = resolveImageUrl(value);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Reset input so same file can be selected again
      event.target.value = "";

      setIsUploading(true);
      try {
        const result = await filesApi.upload(file);
        onChange(result.url);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className={cn("group relative inline-flex", className)}>
      <input
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      {resolvedUrl ? (
        <div className="relative">
          {/* biome-ignore lint/performance/noImgElement: dynamic uploaded images, not suitable for next/image */}
          {/* biome-ignore lint/correctness/useImageSize: dimensions set via CSS classes */}
          <img
            alt="Uploaded"
            className={cn(
              sizeClassName,
              "border object-contain p-1",
              shape === "circle" ? "rounded-full" : "rounded-lg"
            )}
            src={resolvedUrl}
          />
          {!disabled && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100",
                shape === "circle" ? "rounded-full" : "rounded-lg"
              )}
            >
              <Button
                className="text-white hover:bg-white/20"
                onClick={() => inputRef.current?.click()}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <ImagePlus className="size-4" />
              </Button>
              <Button
                className="text-white hover:bg-white/20"
                onClick={handleRemove}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          className={cn(
            sizeClassName,
            "flex flex-col items-center justify-center gap-1 border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            shape === "circle" ? "rounded-full" : "rounded-lg",
            disabled && "pointer-events-none opacity-50"
          )}
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-[10px] leading-tight">{placeholder}</span>
            </>
          )}
        </button>
      )}

      {isUploading && resolvedUrl && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50",
            shape === "circle" ? "rounded-full" : "rounded-lg"
          )}
        >
          <Loader2 className="size-5 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
