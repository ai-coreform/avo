"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import { Switch } from "@avo/ui/components/ui/switch";
import { ChevronDown, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import type { LocaleConfig } from "@/data/locale-configs";

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

interface LocaleCardProps {
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
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (node: HTMLElement | null) => void;
}

function computeProgress(
  locale: LocaleConfig,
  stats: LocaleStats | undefined,
  activeJob: ActiveJob | null
) {
  const isLocaleTargeted = Boolean(
    activeJob?.targetLocales.includes(locale.code)
  );
  const translated =
    isLocaleTargeted && activeJob
      ? activeJob.completedUnits
      : (stats?.translated ?? 0);
  const total =
    isLocaleTargeted && activeJob ? activeJob.totalUnits : (stats?.total ?? 0);
  let pct = 0;
  if (total > 0) {
    pct =
      translated >= total
        ? 100
        : Math.min(99, Math.floor((translated / total) * 100));
  }

  return { translated, total, pct };
}

function getProgressColor(pct: number) {
  if (pct === 100) {
    return "#22c55e";
  }
  if (pct > 50) {
    return "hsl(var(--primary))";
  }
  return "#eab308";
}

export function LocaleCard({
  locale,
  stats,
  enabled,
  isLoading,
  activeJob,
  isBusy,
  canRetryFailedRun,
  onRetranslate,
  onTranslateMissing,
  onRemove,
  onToggleEnabled,
  dragHandleProps,
  dragHandleRef,
}: LocaleCardProps) {
  const isLocaleTargeted = Boolean(
    activeJob?.targetLocales.includes(locale.code)
  );
  const isRunning =
    (activeJob?.status === "running" || activeJob?.status === "pending") &&
    isLocaleTargeted;
  const isFailed = activeJob?.status === "failed" && isLocaleTargeted;
  const { translated, total, pct } = computeProgress(locale, stats, activeJob);

  return (
    <div
      className={`group/card rounded-lg border bg-card p-4 shadow-sm transition-colors ${
        enabled ? "border-border" : "border-muted opacity-60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {dragHandleProps ? (
            <button
              ref={dragHandleRef}
              {...dragHandleProps}
              aria-label="Trascina per riordinare"
              className="-ml-1 cursor-grab rounded p-0.5 text-border opacity-0 transition-all hover:text-muted-foreground active:cursor-grabbing group-hover/card:opacity-100"
              type="button"
            >
              <GripVerticalIcon className="size-4" />
            </button>
          ) : null}
          <span className="text-xl leading-none">{locale.flag}</span>
          <div>
            <div className="font-bold font-display text-[14px] text-foreground">
              {locale.name}
            </div>
            <div className="font-sans text-[11px] text-muted-foreground">
              {locale.code.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusOrActions
            canRetryFailedRun={canRetryFailedRun}
            isBusy={isBusy}
            isFailed={isFailed}
            isRunning={isRunning}
            onRetranslate={onRetranslate}
            onTranslateMissing={onTranslateMissing}
            total={total}
            translated={translated}
          />
          <button
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            disabled={isBusy}
            onClick={onRemove}
            title="Rimuovi lingua"
            type="button"
          >
            <Trash2 className="size-3.5" />
          </button>
          <Switch
            checked={enabled}
            className="data-[state=checked]:bg-primary"
            disabled={isBusy}
            onCheckedChange={onToggleEnabled}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-1.5 animate-pulse rounded-full bg-muted" />
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: getProgressColor(pct),
              }}
            />
          </div>
          <div className="mt-1.5 font-sans text-[11px] text-muted-foreground">
            {translated}/{total} elementi ({pct}%)
          </div>
          {isFailed && activeJob?.errorMessage ? (
            <div className="mt-1.5 font-sans text-[11px] text-red-600">
              {activeJob.errorMessage}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function StatusOrActions({
  isRunning,
  isFailed,
  isBusy,
  canRetryFailedRun,
  translated,
  total,
  onRetranslate,
  onTranslateMissing,
}: {
  isRunning: boolean;
  isFailed: boolean;
  isBusy: boolean;
  canRetryFailedRun: boolean;
  translated: number;
  total: number;
  onRetranslate: () => void;
  onTranslateMissing: () => void;
}) {
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2 py-0.5 font-medium text-[10px] text-primary">
        <Loader2 className="size-3 animate-spin" />
        Traduzione...
      </span>
    );
  }

  if (isFailed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-[10px] text-red-600"
            title="Errore — clicca per ritentare"
            type="button"
          >
            Errore
            <ChevronDown className="size-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem
            className="cursor-pointer text-[13px]"
            onClick={onTranslateMissing}
          >
            <RefreshCw className="mr-2 size-3.5" />
            Ritenta mancanti
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-[13px]"
            onClick={onRetranslate}
          >
            <RefreshCw className="mr-2 size-3.5" />
            Ri-traduci tutto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-primary"
          disabled={isBusy && !canRetryFailedRun}
          title="Opzioni traduzione"
          type="button"
        >
          <RefreshCw className="size-3.5" />
          <ChevronDown className="size-2.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {translated < total ? (
          <DropdownMenuItem
            className="cursor-pointer text-[13px]"
            onClick={onTranslateMissing}
          >
            <RefreshCw className="mr-2 size-3.5" />
            Traduci mancanti
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="cursor-pointer text-[13px]"
          onClick={onRetranslate}
        >
          <RefreshCw className="mr-2 size-3.5" />
          Ri-traduci tutto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GripVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}
