"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePendingEditsActions } from "./pending-edits-context";

interface EditableCellProps {
  defaultValue: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputMode?: "text" | "decimal";
  prefix?: string;
  readOnly?: boolean;
}

/**
 * Always-rendered <input> that looks like plain text when unfocused.
 *
 * While the user types, `onCommit` fires on every keystroke so that the
 * editor state (and thus the preview) stays in sync. Focus is preserved
 * because the column definitions that drive TanStack Table are memoised
 * with stable deps — the table updates its data without unmounting cells.
 *
 * The save toolbar is shown via a lightweight context
 * (PendingEditsContext) that flips a boolean without touching the
 * table tree.
 *
 * `onCommit` also fires on blur / Enter / Tab with the final value.
 */
function EditableCellComponent({
  defaultValue,
  onCommit,
  placeholder,
  className,
  inputMode = "text",
  prefix,
  readOnly = false,
}: EditableCellProps) {
  const cellId = useId();
  const [draft, setDraft] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, unregister } = usePendingEditsActions();

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setDraft(defaultValue);
    }
  }, [defaultValue, isFocused]);

  // Signal pending edit state to toolbar
  useEffect(() => {
    if (isFocused && draft.trim() !== defaultValue) {
      register(cellId);
    } else {
      unregister(cellId);
    }
  }, [isFocused, draft, defaultValue, cellId, register, unregister]);

  // Cleanup on unmount
  useEffect(() => {
    return () => unregister(cellId);
  }, [cellId, unregister]);

  if (readOnly) {
    return (
      <div className="flex min-w-0 items-center">
        {prefix ? (
          <span className="mr-0.5 shrink-0 text-muted-foreground text-sm leading-[22px]">
            {prefix}
          </span>
        ) : null}
        <span
          className={cn(
            "w-full truncate text-foreground text-sm leading-[22px]",
            !defaultValue && "text-muted-foreground",
            className
          )}
        >
          {defaultValue || placeholder || "\u00A0"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center">
      {prefix ? (
        <span className="mr-0.5 shrink-0 text-muted-foreground text-sm leading-[22px]">
          {prefix}
        </span>
      ) : null}
      <input
        className={cn(
          "w-full border-none bg-transparent p-0 text-foreground text-sm leading-[22px] outline-none [appearance:textfield] placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          !isFocused && "cursor-text overflow-hidden text-ellipsis",
          className
        )}
        data-no-row-click
        inputMode={inputMode}
        onBlur={() => {
          setIsFocused(false);
          const trimmed = draft.trim();
          if (trimmed !== defaultValue) {
            onCommit(trimmed);
          }
        }}
        onChange={(event) => {
          const value = event.target.value;
          setDraft(value);
          onCommit(value.trim());
        }}
        onFocus={() => {
          setIsFocused(true);
          requestAnimationFrame(() => {
            const input = inputRef.current;
            if (input) {
              if (input.type !== "number") {
                const len = input.value.length;
                input.setSelectionRange(len, len);
              }
              input.scrollLeft = input.scrollWidth;
            }
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            inputRef.current?.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDraft(defaultValue);
            inputRef.current?.blur();
          }
        }}
        placeholder={placeholder || "\u00A0"}
        ref={inputRef}
        step={inputMode === "decimal" ? "0.01" : undefined}
        type={inputMode === "decimal" ? "number" : "text"}
        value={isFocused ? draft : defaultValue}
      />
    </div>
  );
}

export const EditableCell = memo(EditableCellComponent);
