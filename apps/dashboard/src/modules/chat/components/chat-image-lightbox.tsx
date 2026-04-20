"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { type ReactNode, useState } from "react";

interface ChatImageLightboxProps {
  src: string;
  alt: string;
  trigger: ReactNode;
}

export function ChatImageLightbox({
  src,
  alt,
  trigger,
}: ChatImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="cursor-pointer"
        onClick={() => setOpen(true)}
        type="button"
      >
        {trigger}
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* biome-ignore lint/performance/noImgElement: lightbox preview */}
          {/* biome-ignore lint/correctness/useImageSize: dynamic image */}
          <img
            alt={alt}
            className="max-h-[80vh] w-full rounded-lg object-contain"
            src={src}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
