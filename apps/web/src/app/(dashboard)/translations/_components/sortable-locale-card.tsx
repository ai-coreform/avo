"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LocaleConfig } from "@/data/locale-configs";
import { LocaleCard } from "./locale-card";

interface LocaleStats {
  translated: number;
  total: number;
}

interface ActiveJob {
  id: string;
  status: string;
  targetLocales: string[];
  totalUnits: number;
  completedUnits: number;
  failedUnits: number;
  startedAt: string | null;
  errorMessage?: string | null;
}

interface SortableLocaleCardProps {
  locale: LocaleConfig;
  stats: LocaleStats | undefined;
  enabled: boolean;
  isLoading: boolean;
  activeJob: ActiveJob | null;
  isBusy: boolean;
  canRetryFailedRun: boolean;
  onRetranslate: () => void;
  onTranslateMissing: () => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export function SortableLocaleCard({
  locale,
  ...rest
}: SortableLocaleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: locale.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={isDragging ? "z-10 shadow-lg ring-2 ring-primary/20" : ""}
      ref={setNodeRef}
      style={style}
    >
      <LocaleCard
        dragHandleProps={{ ...attributes, ...listeners }}
        dragHandleRef={setActivatorNodeRef}
        locale={locale}
        {...rest}
      />
    </div>
  );
}
