"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { Separator } from "@avo/ui/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { menusApi } from "@/api/menu";
import type { MenuListItem } from "@/api/menu/types";
import { menusQueryKeys } from "@/api/menu/use-get-menus";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { useUpdateVenue } from "@/api/venue/use-update-venue";
import {
  useAiSettingsPreviewSync,
  useChatOpenPreviewSync,
  useMenuDataPreviewSync,
} from "@/components/preview/menu-preview-iframe";
import { MenuPreviewPanel } from "@/components/preview/menu-preview-panel";
import { useLayout } from "@/providers/layout-provider";
import { PageActions } from "@/providers/page-header-provider";
import { LookSection } from "./look-section";
import { PersonalitySection } from "./personality-section";
import { QuestionsSection } from "./questions-section";
import {
  type AiWaiterFormValues,
  aiWaiterFormSchema,
  DEFAULT_FORM_VALUES,
  DEFAULT_WELCOME_QUESTIONS,
} from "./types";

const XL_BREAKPOINT = 1280;
const xlSubscribe = (cb: () => void) => {
  const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const xlSnapshot = () => window.innerWidth >= XL_BREAKPOINT;
const xlServerSnapshot = () => false;

interface AiWaiterPageViewProps {
  data: { menus: MenuListItem[]; venueSlug: string | null };
}

export function AiWaiterPageView({ data }: AiWaiterPageViewProps) {
  const isXl = useSyncExternalStore(xlSubscribe, xlSnapshot, xlServerSnapshot);
  const { showPreview, togglePreview } = useLayout();

  const venueQuery = useGetVenue();
  const updateVenue = useUpdateVenue();

  // Hydrate from saved settings, falling back to defaults for missing fields.
  // The form starts with defaults, then resets to server values once they
  // arrive — same pattern as venue-page-view.tsx (no flash because the form
  // is rendered inside MenuPreviewPanel which loads after the data anyway).
  const form = useForm<AiWaiterFormValues>({
    resolver: zodResolver(aiWaiterFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const savedAiSettings = venueQuery.data?.aiSettings;
  useEffect(() => {
    if (!savedAiSettings) {
      return;
    }
    form.reset({
      bgColor: savedAiSettings.bgColor ?? DEFAULT_FORM_VALUES.bgColor,
      questions: savedAiSettings.questions ?? [
        ...DEFAULT_FORM_VALUES.questions,
      ],
      personality:
        savedAiSettings.personality ?? DEFAULT_FORM_VALUES.personality,
    });
    // Only re-run when the JSON-serialized identity of saved settings changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(savedAiSettings)]);

  const { isDirty, isSubmitting } = form.formState;

  const onSubmit = useCallback(
    async (values: AiWaiterFormValues) => {
      // Default-questions trap: if the admin saves the four built-in default
      // questions verbatim (e.g. they only changed color and never touched
      // questions), persist `null` so the public chat panel falls back to the
      // locale-translated defaults from chat-translations.ts. This avoids
      // the bug where Italian defaults get pinned to all locales for an
      // English-speaking customer base.
      const questionsArePristine = arraysEqual(
        values.questions,
        DEFAULT_WELCOME_QUESTIONS as readonly string[]
      );

      await updateVenue.mutateAsync({
        aiSettings: {
          bgColor: values.bgColor,
          // null clears the field server-side → falls back to locale defaults
          questions: questionsArePristine ? null : values.questions,
          personality: values.personality,
        },
      });
      form.reset(values);
      toast.success("Impostazioni del Cameriere AI salvate");
    },
    [form, updateVenue]
  );

  const handleReset = useCallback(() => {
    if (savedAiSettings) {
      form.reset({
        bgColor: savedAiSettings.bgColor ?? DEFAULT_FORM_VALUES.bgColor,
        questions: savedAiSettings.questions ?? [
          ...DEFAULT_FORM_VALUES.questions,
        ],
        personality:
          savedAiSettings.personality ?? DEFAULT_FORM_VALUES.personality,
      });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
  }, [form, savedAiSettings]);

  const previewMenu = data.menus[0] ?? null;
  const venueSlug = data.venueSlug;
  const canShowPreview = isXl && showPreview && previewMenu && venueSlug;

  // Fetch the public menu payload and pipe it into the iframe via postMessage.
  // Without this, the iframe stays in preview mode forever waiting for an
  // `avo-preview:menu-update` message and shows "Caricamento menu...".
  const previewQuery = useQuery({
    queryKey: [...menusQueryKeys.detail(previewMenu?.slug ?? ""), "preview"],
    queryFn: async () => {
      if (!previewMenu) {
        throw new Error("No menu to preview");
      }
      const response = await menusApi.getPreview(previewMenu.slug);
      return response.data;
    },
    enabled: previewMenu != null,
  });
  useMenuDataPreviewSync(previewQuery.data ?? null);

  // Open the chat panel inside the preview iframe automatically — this is the
  // surface admins are configuring, so it should be visible from the start.
  useChatOpenPreviewSync(true);

  // Live-sync form values into the iframe so admins see color/questions/
  // personality changes in the chat preview without saving first.
  const watchedBgColor = useWatch({ control: form.control, name: "bgColor" });
  const watchedQuestions = useWatch({
    control: form.control,
    name: "questions",
  });
  const watchedPersonality = useWatch({
    control: form.control,
    name: "personality",
  });
  const previewSettings = useMemo(
    () => ({
      bgColor: watchedBgColor,
      questions: watchedQuestions,
      personality: watchedPersonality,
    }),
    [watchedBgColor, watchedQuestions, watchedPersonality]
  );
  useAiSettingsPreviewSync(previewSettings);

  const settingsContent = (
    <Form {...form}>
      <form
        className="px-4 pb-12"
        id="ai-waiter-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <PageActions>
          <Button
            disabled={!isDirty || isSubmitting}
            onClick={handleReset}
            type="button"
            variant="outline"
          >
            <Undo2 className="size-4" />
            Ripristina
          </Button>
          <Button
            disabled={isSubmitting || !isDirty}
            form="ai-waiter-form"
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salva
          </Button>
        </PageActions>

        <div className="mt-6 max-w-3xl space-y-8">
          <LookSection control={form.control} />

          <Separator />

          <QuestionsSection control={form.control} setValue={form.setValue} />

          <Separator />

          <PersonalitySection control={form.control} />
        </div>
      </form>
    </Form>
  );

  if (canShowPreview) {
    return (
      <MenuPreviewPanel
        menuSlug={previewMenu.slug}
        onClosePreview={togglePreview}
        showPreview
        venueSlug={venueSlug}
      >
        <div className="h-full overflow-y-auto">{settingsContent}</div>
      </MenuPreviewPanel>
    );
  }

  return <div className="h-full overflow-y-auto">{settingsContent}</div>;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
