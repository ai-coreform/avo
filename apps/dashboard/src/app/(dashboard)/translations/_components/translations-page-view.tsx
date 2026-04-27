"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { localesApi } from "@/api/locales";
import type { VenueLocale } from "@/api/locales/types";
import { LOCALES_QUERY_KEY } from "@/api/locales/use-get-locales";
import { translationsApi } from "@/api/translations";
import {
  TRANSLATION_STATS_QUERY_KEY,
  useTranslationStats,
} from "@/api/translations/use-translation-stats";
import {
  TRANSLATION_STATUS_QUERY_KEY,
  useTranslationStatus,
} from "@/api/translations/use-translation-status";
import { getLocaleConfig } from "@/data/locale-configs";
import { PageActions } from "@/providers/page-header-provider";
import { AddLanguageDialog } from "./add-language-dialog";
import { SortableLocaleCard } from "./sortable-locale-card";
import { TranslationsInfoSection } from "./translations-info-section";

interface TranslationsPageViewProps {
  locales: VenueLocale[];
}

export function TranslationsPageView({ locales }: TranslationsPageViewProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const previousActiveJobIdRef = useRef<string | null>(null);

  const translationStatusQuery = useTranslationStatus();
  const activeJob = translationStatusQuery.data?.data.job ?? null;
  const isJobRunning =
    activeJob?.status === "running" || activeJob?.status === "pending";

  const statsQuery = useTranslationStats(isJobRunning);
  const stats = statsQuery.data?.data ?? null;

  const secondaryLocales = locales.filter((l) => l.locale !== "it");
  const secondaryCodes = secondaryLocales.map((l) => l.locale);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const reorderMutation = useMutation({
    mutationFn: (codes: string[]) => localesApi.reorder(codes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCALES_QUERY_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (locale: string) => localesApi.remove(locale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCALES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: TRANSLATION_STATS_QUERY_KEY,
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      locale,
      isEnabled,
    }: {
      locale: string;
      isEnabled: boolean;
    }) => localesApi.toggle(locale, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCALES_QUERY_KEY });
    },
  });

  const translateMutation = useMutation({
    mutationFn: (body: { locales: string[]; missingOnly: boolean }) =>
      translationsApi.translate(body.locales, body.missingOnly),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TRANSLATION_STATUS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: TRANSLATION_STATS_QUERY_KEY,
      });
    },
  });

  const isBusy =
    isJobRunning ||
    reorderMutation.isPending ||
    removeMutation.isPending ||
    toggleMutation.isPending ||
    translateMutation.isPending;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (isBusy) {
        return;
      }
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = secondaryCodes.indexOf(active.id as string);
      const newIndex = secondaryCodes.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(secondaryCodes, oldIndex, newIndex);
      reorderMutation.mutate(reordered);
    },
    [isBusy, secondaryCodes, reorderMutation]
  );

  const handleRetranslate = useCallback(
    (code: string) => {
      const config = getLocaleConfig(code);
      translateMutation.mutate(
        { locales: [code], missingOnly: false },
        {
          onSuccess: () =>
            toast.success(`Ri-traduzione avviata per ${config?.name ?? code}`),
          onError: () => toast.error("Errore nell'avvio della traduzione"),
        }
      );
    },
    [translateMutation]
  );

  const handleTranslateMissing = useCallback(
    (code: string) => {
      const config = getLocaleConfig(code);
      translateMutation.mutate(
        { locales: [code], missingOnly: true },
        {
          onSuccess: () =>
            toast.success(
              `Traduzione mancanti avviata per ${config?.name ?? code}`
            ),
          onError: () => toast.error("Errore nell'avvio della traduzione"),
        }
      );
    },
    [translateMutation]
  );

  const handleRemove = useCallback(
    (code: string) => {
      const config = getLocaleConfig(code);
      removeMutation.mutate(code, {
        onSuccess: () => toast.success(`${config?.name ?? code} rimossa`),
        onError: () => toast.error("Errore nella rimozione della lingua"),
      });
    },
    [removeMutation]
  );

  const handleToggleEnabled = useCallback(
    (code: string, currentEnabled: boolean) => {
      const config = getLocaleConfig(code);
      toggleMutation.mutate(
        { locale: code, isEnabled: !currentEnabled },
        {
          onSuccess: () =>
            toast.success(
              currentEnabled
                ? `${config?.name ?? code} disattivata`
                : `${config?.name ?? code} attivata`
            ),
          onError: () => toast.error("Errore nell'aggiornamento della lingua"),
        }
      );
    },
    [toggleMutation]
  );

  const handleAddLanguage = useCallback(
    async (code: string) => {
      const config = getLocaleConfig(code);
      try {
        await localesApi.add(code);
        setShowAddDialog(false);
        queryClient.invalidateQueries({ queryKey: LOCALES_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: TRANSLATION_STATUS_QUERY_KEY,
        });
        queryClient.invalidateQueries({
          queryKey: TRANSLATION_STATS_QUERY_KEY,
        });
        toast.success(`${config?.name ?? code} aggiunta`);
      } catch {
        toast.error("Errore nell'aggiunta della lingua");
      }
    },
    [queryClient]
  );

  const addedCodes = useMemo(
    () => new Set(locales.map((l) => l.locale)),
    [locales]
  );

  // Refetch stats when a job finishes
  useEffect(() => {
    if (previousActiveJobIdRef.current && !activeJob) {
      statsQuery.refetch();
    }
    previousActiveJobIdRef.current = activeJob?.id ?? null;
  }, [activeJob, statsQuery]);

  const italianConfig = getLocaleConfig("it");
  const failedTargetLocales = new Set(
    activeJob?.status === "failed" ? activeJob.targetLocales : []
  );

  return (
    <div className="space-y-6">
      {/* Failed job banner */}
      {activeJob?.status === "failed" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-[13px] text-red-700">
            Traduzione interrotta
          </p>
          <p className="mt-1 font-sans text-[12px] text-red-600">
            {activeJob.errorMessage ??
              "Si è verificato un errore durante la traduzione."}
          </p>
        </div>
      )}

      <PageActions>
        <Button disabled={isBusy} onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" />
          Aggiungi lingua
        </Button>
      </PageActions>

      {/* Section label */}
      <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
        Lingue attive
      </p>

      {/* Language cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Italian — primary, always first */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl leading-none">
                {italianConfig?.flag}
              </span>
              <div>
                <div className="font-bold font-display text-[14px] text-foreground">
                  Italiano
                </div>
                <div className="font-sans text-[11px] text-muted-foreground">
                  Lingua principale
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-green-500">
              <Check className="size-3.5" />
              <span className="font-medium text-[11px]">Primaria</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-green-500/20">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: "100%" }}
            />
          </div>
          <div className="mt-1.5 font-sans text-[11px] text-muted-foreground">
            {stats ? `${stats.total}/${stats.total} elementi` : "..."}
          </div>
        </div>

        {/* Secondary languages — sortable */}
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={secondaryCodes}
            strategy={rectSortingStrategy}
          >
            {secondaryLocales.map((venueLocale) => {
              const config = getLocaleConfig(venueLocale.locale);
              if (!config) {
                return null;
              }

              return (
                <SortableLocaleCard
                  activeJob={activeJob}
                  canRetryFailedRun={failedTargetLocales.has(config.code)}
                  enabled={venueLocale.isEnabled}
                  isBusy={isBusy}
                  isLoading={statsQuery.isPending}
                  key={config.code}
                  locale={config}
                  onRemove={() => handleRemove(config.code)}
                  onRetranslate={() => handleRetranslate(config.code)}
                  onToggleEnabled={() =>
                    handleToggleEnabled(config.code, venueLocale.isEnabled)
                  }
                  onTranslateMissing={() => handleTranslateMissing(config.code)}
                  stats={stats?.perLocale[config.code]}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* Info section */}
      <TranslationsInfoSection />

      {/* Add language dialog */}
      <AddLanguageDialog
        addedCodes={addedCodes}
        isBusy={isBusy}
        onAdd={handleAddLanguage}
        onOpenChange={setShowAddDialog}
        open={showAddDialog}
      />
    </div>
  );
}
