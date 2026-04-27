"use client";

import { MessageSquare } from "lucide-react";

const DEFAULT_BG = "#1a1a1a";

interface AvoChatFabProps {
  onClick: () => void;
  bgColor?: string;
}

export function AvoChatFab({ onClick, bgColor = DEFAULT_BG }: AvoChatFabProps) {
  return (
    <button
      aria-label="Apri assistente AVO"
      className="fixed right-4 bottom-6 z-40 flex items-center justify-center"
      onClick={onClick}
      type="button"
    >
      <div className="relative">
        {/* Avocado circle */}
        <div
          className="flex size-16 items-center justify-center rounded-full p-3.5 shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: bgColor }}
        >
          {/* biome-ignore lint/performance/noImgElement: static asset */}
          {/* biome-ignore lint/correctness/useImageSize: sized via CSS */}
          <img
            alt=""
            className="size-full object-contain"
            src="/images/avo-icon-white.svg"
          />
        </div>
        {/* Chat badge */}
        <div
          className="absolute -top-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: bgColor }}
        >
          <MessageSquare className="size-3.5 fill-white text-white" />
        </div>
      </div>
    </button>
  );
}
