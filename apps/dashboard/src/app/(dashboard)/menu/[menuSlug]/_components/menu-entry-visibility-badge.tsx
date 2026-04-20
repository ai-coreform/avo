"use client";

import { cn } from "@/lib/utils";

interface MenuEntryVisibilityBadgeProps {
  isVisible: boolean;
  onToggle?: (nextVisible: boolean) => void;
}

export function MenuEntryVisibilityBadge({
  isVisible,
  onToggle,
}: MenuEntryVisibilityBadgeProps) {
  const Comp = onToggle ? "button" : "div";

  return (
    <Comp
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-xs transition-colors",
        isVisible
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted text-muted-foreground",
        onToggle && "cursor-pointer"
      )}
      {...(onToggle
        ? {
            onClick: () => onToggle(!isVisible),
            type: "button" as const,
          }
        : {})}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isVisible ? "bg-emerald-500" : "bg-muted-foreground"
        )}
      />
      {isVisible ? "Visibile" : "Nascosta"}
    </Comp>
  );
}
