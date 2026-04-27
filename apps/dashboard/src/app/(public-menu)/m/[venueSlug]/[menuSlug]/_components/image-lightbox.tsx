"use client";

import Image from "next/image";
import { useEffect } from "react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center duration-200"
      role="dialog"
    >
      <button
        aria-label="Chiudi sfondo"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        type="button"
      />
      <button
        aria-label="Chiudi"
        className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        onClick={onClose}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="20"
        >
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      </button>
      <div className="zoom-in-95 relative z-[1] max-h-[85vh] max-w-[90vw] animate-in duration-200">
        <Image
          alt={alt}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
          height={800}
          sizes="90vw"
          src={src}
          unoptimized
          width={800}
        />
      </div>
    </div>
  );
}
