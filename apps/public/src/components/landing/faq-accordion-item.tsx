"use client";

import { useState } from "react";

export function FaqAccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-5">
      <button
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <h3 className="font-display font-semibold text-[17px] text-ink leading-snug tracking-tight">
          {question}
        </h3>
        <span
          aria-hidden
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors group-hover:bg-ink/10"
        >
          <svg
            aria-hidden="true"
            className={`text-ink/50 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
            fill="none"
            height="14"
            viewBox="0 0 14 14"
            width="14"
          >
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-xl pt-3 text-[15px] text-ink/55 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
