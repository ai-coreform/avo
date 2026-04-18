"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Checkbox } from "@avo/ui/components/ui/checkbox";
import { Form } from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@avo/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@avo/ui/components/ui/sheet";
import { Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { CatalogItemListItem } from "@/api/catalog-items/types";
import type { PromoListItem, PromoSchedule } from "@/api/promos/types";
import { useCreatePromo, useUpdatePromo } from "@/api/promos/use-mutate-promos";
import FormInput from "@/components/form/form-input";
import FormTextArea from "@/components/form/form-textarea";
import { ImageUpload } from "@/components/image-upload";
import {
  buildLocaleOptions,
  buildMenuEntityTranslations,
  createEmptyMenuSheetTranslations,
  MENU_EDITOR_SOURCE_LOCALE,
  type MenuSheetTranslations,
} from "../_utils/menu-translations";
import { CatalogItemPickerDialog } from "./catalog-item-picker-dialog";
import { MenuEntryVisibilityBadge } from "./menu-entry-visibility-badge";
import { MenuLocaleTabs } from "./menu-locale-tabs";

interface MenuPromoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuSlug: string;
  promo: PromoListItem | null;
  locales: string[];
}

type ScheduleMode = "always" | "timeframe" | "recurring";

const WEEKDAY_OPTIONS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mer" },
  { value: "thu", label: "Gio" },
  { value: "fri", label: "Ven" },
  { value: "sat", label: "Sab" },
  { value: "sun", label: "Dom" },
] as const;

function inferScheduleMode(schedules: PromoSchedule[]): ScheduleMode {
  if (schedules.length === 0) {
    return "always";
  }
  if (schedules.some((s) => s.weekday !== null)) {
    return "recurring";
  }
  if (schedules.some((s) => s.startDate !== null || s.endDate !== null)) {
    return "timeframe";
  }
  return "always";
}

function getWeekdaysFromSchedules(
  schedules: PromoSchedule[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const day of WEEKDAY_OPTIONS) {
    result[day.value] = schedules.some((s) => s.weekday === day.value);
  }
  return result;
}

interface PromoComponentFormValue {
  catalogItemId: string | null;
  displayName: string;
  quantity: string;
}

interface PromoFormValues {
  title: string;
  shortDescription: string;
  longDescription: string;
  promoPrice: string;
  originalPrice: string;
  badgeLabel: string;
  imageUrl: string | null;
  isActive: boolean;
  components: PromoComponentFormValue[];
  translations: MenuSheetTranslations;
  scheduleMode: ScheduleMode;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  scheduleWeekdays: Record<string, boolean>;
}

function getDefaultValues(
  promo: PromoListItem | null,
  locales: string[]
): PromoFormValues {
  const emptySchedule = {
    scheduleMode: "always" as ScheduleMode,
    scheduleStartDate: "",
    scheduleEndDate: "",
    scheduleStartTime: "",
    scheduleEndTime: "",
    scheduleWeekdays: Object.fromEntries(
      WEEKDAY_OPTIONS.map((d) => [d.value, false])
    ),
  };

  if (!promo) {
    return {
      title: "",
      shortDescription: "",
      longDescription: "",
      promoPrice: "",
      originalPrice: "",
      badgeLabel: "",
      imageUrl: null,
      isActive: true,
      components: [],
      translations: createEmptyMenuSheetTranslations(locales),
      ...emptySchedule,
    };
  }

  const mode = inferScheduleMode(promo.schedules);
  const firstSchedule = promo.schedules[0];

  return {
    title: promo.title,
    shortDescription: promo.shortDescription,
    longDescription: promo.longDescription ?? "",
    promoPrice: `${promo.promoPrice}`,
    originalPrice: promo.originalPrice !== null ? `${promo.originalPrice}` : "",
    badgeLabel: promo.badgeLabel ?? "",
    imageUrl: promo.imageUrl ?? null,
    isActive: promo.isActive,
    components: promo.components.map((c) => ({
      catalogItemId: c.catalogItemId ?? null,
      displayName: c.displayName ?? "",
      quantity: `${c.quantity}`,
    })),
    translations: createEmptyMenuSheetTranslations(locales, promo.translations),
    scheduleMode: mode,
    scheduleStartDate: firstSchedule?.startDate ?? "",
    scheduleEndDate: firstSchedule?.endDate ?? "",
    scheduleStartTime: firstSchedule?.startTime?.slice(0, 5) ?? "",
    scheduleEndTime: firstSchedule?.endTime?.slice(0, 5) ?? "",
    scheduleWeekdays:
      mode === "recurring"
        ? getWeekdaysFromSchedules(promo.schedules)
        : Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.value, false])),
  };
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function ScheduleSection({
  form,
}: {
  form: ReturnType<typeof useForm<PromoFormValues>>;
}) {
  const scheduleMode = useWatch({
    control: form.control,
    name: "scheduleMode",
  });
  const weekdays = useWatch({
    control: form.control,
    name: "scheduleWeekdays",
  });

  return (
    <div className="space-y-4 border-t pt-5">
      <div>
        <h3 className="font-medium text-base">Programmazione</h3>
      </div>

      <div>
        <Select
          onValueChange={(v) =>
            form.setValue("scheduleMode", v as ScheduleMode, {
              shouldDirty: true,
            })
          }
          value={scheduleMode}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="always">Sempre attiva</SelectItem>
            <SelectItem value="timeframe">Periodo specifico</SelectItem>
            <SelectItem value="recurring">Ricorrente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scheduleMode === "timeframe" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data inizio</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleStartDate", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="date"
                value={form.watch("scheduleStartDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ora inizio</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleStartTime", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="time"
                value={form.watch("scheduleStartTime")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data fine</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleEndDate", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="date"
                value={form.watch("scheduleEndDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ora fine</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleEndTime", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="time"
                value={form.watch("scheduleEndTime")}
              />
            </div>
          </div>
        </div>
      )}

      {scheduleMode === "recurring" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {WEEKDAY_OPTIONS.map((day) => (
              <Label
                className="flex cursor-pointer items-center gap-1.5"
                key={day.value}
              >
                <Checkbox
                  checked={weekdays?.[day.value] ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      `scheduleWeekdays.${day.value}`,
                      checked === true,
                      { shouldDirty: true }
                    )
                  }
                />
                <span className="text-sm">{day.label}</span>
              </Label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dalle</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleStartTime", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="time"
                value={form.watch("scheduleStartTime")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alle</Label>
              <Input
                onChange={(e) =>
                  form.setValue("scheduleEndTime", e.target.value, {
                    shouldDirty: true,
                  })
                }
                type="time"
                value={form.watch("scheduleEndTime")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MenuPromoSheet({
  open,
  onOpenChange,
  menuSlug,
  promo,
  locales,
}: MenuPromoSheetProps) {
  const isEditing = promo !== null;
  const createPromo = useCreatePromo(menuSlug);
  const updatePromo = useUpdatePromo(menuSlug);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const localeOptions = useMemo(() => buildLocaleOptions(locales), [locales]);
  const [activeLocale, setActiveLocale] = useState<string>(
    MENU_EDITOR_SOURCE_LOCALE
  );

  const defaultValues = useMemo(
    () => getDefaultValues(promo, locales),
    [promo, locales]
  );

  const form = useForm<PromoFormValues>({
    defaultValues,
    shouldUnregister: false,
  });

  const title = useWatch({ control: form.control, name: "title" });
  const isActive = useWatch({ control: form.control, name: "isActive" });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setActiveLocale(MENU_EDITOR_SOURCE_LOCALE);
    }
  }, [open, defaultValues, form]);

  function handleCatalogItemsSelected(items: CatalogItemListItem[]) {
    for (const item of items) {
      append({
        catalogItemId: item.id,
        displayName: item.title,
        quantity: "1",
      });
    }
  }

  async function onSubmit(values: PromoFormValues) {
    const promoPrice = parsePrice(values.promoPrice);
    if (promoPrice === null || promoPrice < 0) {
      form.setError("promoPrice", { message: "Prezzo non valido" });
      return;
    }

    const originalPrice = parsePrice(values.originalPrice);
    const components = values.components
      .filter((c) => c.displayName.trim().length > 0)
      .map((c) => ({
        catalogItemId: c.catalogItemId ?? null,
        displayName: c.displayName.trim(),
        quantity: Math.max(1, Number.parseInt(c.quantity, 10) || 1),
      }));

    const translations = buildMenuEntityTranslations(values.translations);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let schedules: {
      weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" | null;
      startTime: string | null;
      endTime: string | null;
      startDate: string | null;
      endDate: string | null;
      timezone: string;
      isActive: boolean;
    }[] = [];

    if (values.scheduleMode === "timeframe") {
      schedules = [
        {
          weekday: null,
          startTime: values.scheduleStartTime || null,
          endTime: values.scheduleEndTime || null,
          startDate: values.scheduleStartDate || null,
          endDate: values.scheduleEndDate || null,
          timezone,
          isActive: true,
        },
      ];
    } else if (values.scheduleMode === "recurring") {
      const selectedDays = Object.entries(values.scheduleWeekdays)
        .filter(([, selected]) => selected)
        .map(([day]) => day);
      schedules = selectedDays.map((day) => ({
        weekday: day as "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
        startTime: values.scheduleStartTime || null,
        endTime: values.scheduleEndTime || null,
        startDate: null,
        endDate: null,
        timezone,
        isActive: true,
      }));
    }

    const data = {
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim(),
      longDescription: values.longDescription.trim() || null,
      promoPrice,
      originalPrice,
      badgeLabel: values.badgeLabel.trim() || null,
      imageUrl: values.imageUrl,
      isActive: values.isActive,
      components,
      translations,
      schedules,
    };

    if (isEditing) {
      const request = updatePromo.mutateAsync({
        promoId: promo.id,
        data,
      });
      await toast.promise(request, {
        loading: "Aggiornamento promozione...",
        success: "Promozione aggiornata",
        error: "Errore nell'aggiornamento",
      });
    } else {
      const request = createPromo.mutateAsync(
        data as Parameters<typeof createPromo.mutateAsync>[0]
      );
      await toast.promise(request, {
        loading: "Creazione promozione...",
        success: "Promozione creata",
        error: "Errore nella creazione",
      });
    }

    onOpenChange(false);
  }

  const isPending = createPromo.isPending || updatePromo.isPending;
  const isSourceLocale = activeLocale === MENU_EDITOR_SOURCE_LOCALE;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-full gap-0 p-0 sm:max-w-xl"
        showCloseButton
        side="right"
      >
        <SheetHeader className="gap-3 border-b px-6 pt-6 pb-5">
          <div className="flex min-w-0 items-center gap-3 pr-10">
            <SheetTitle className="min-w-0 truncate font-display text-2xl">
              {title?.trim() || promo?.title || "Nuova promozione"}
            </SheetTitle>
            <MenuEntryVisibilityBadge
              isVisible={Boolean(isActive)}
              onToggle={(nextVisible) =>
                form.setValue("isActive", nextVisible, { shouldDirty: true })
              }
            />
          </div>
          <SheetDescription className="sr-only">
            {isEditing
              ? "Modifica i dettagli della promozione."
              : "Crea una nuova promozione per questo menu."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <MenuLocaleTabs
              activeLocale={activeLocale}
              locales={localeOptions}
              onChange={setActiveLocale}
            />

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {isSourceLocale ? (
                  <>
                    <div>
                      <p className="mb-2 font-medium text-sm">Immagine</p>
                      <ImageUpload
                        onChange={(url) =>
                          form.setValue("imageUrl", url, {
                            shouldDirty: true,
                          })
                        }
                        placeholder="Foto"
                        sizeClassName="size-20"
                        value={form.watch("imageUrl")}
                      />
                    </div>
                    <FormInput
                      autoComplete="off"
                      control={form.control}
                      label="Titolo"
                      name="title"
                      placeholder="es. Happy Hour Spritz"
                      required
                    />

                    <FormTextArea
                      control={form.control}
                      label="Descrizione breve"
                      name="shortDescription"
                      placeholder="es. Spritz + tagliere a prezzo speciale"
                      required
                      rows={3}
                    />

                    <FormTextArea
                      control={form.control}
                      label="Descrizione lunga"
                      name="longDescription"
                      placeholder="Descrizione dettagliata (opzionale)"
                      rows={4}
                    />
                  </>
                ) : (
                  <>
                    <FormInput
                      autoComplete="off"
                      control={form.control}
                      label="Titolo"
                      name={`translations.${activeLocale}.title`}
                      placeholder="Non ancora tradotto"
                    />

                    <FormTextArea
                      control={form.control}
                      label="Descrizione"
                      name={`translations.${activeLocale}.description`}
                      placeholder="Non ancora tradotto"
                      rows={4}
                    />
                  </>
                )}

                {isSourceLocale ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormInput
                        control={form.control}
                        inputMode="decimal"
                        label="Prezzo promo (€)"
                        name="promoPrice"
                        placeholder="0.00"
                        required
                      />
                      <FormInput
                        control={form.control}
                        inputMode="decimal"
                        label="Prezzo originale (€)"
                        name="originalPrice"
                        placeholder="0.00 (opzionale)"
                      />
                    </div>

                    <FormInput
                      control={form.control}
                      label="Badge"
                      name="badgeLabel"
                      placeholder="es. HOT DEAL (opzionale)"
                    />

                    <div className="space-y-4 border-t pt-5">
                      <div>
                        <h3 className="font-medium text-base">Componenti</h3>
                      </div>
                      <div className="space-y-2">
                        {fields.map((field, index) => {
                          const isLinked = form.watch(
                            `components.${index}.catalogItemId`
                          );
                          return (
                            <div
                              className="flex items-center gap-2"
                              key={field.id}
                            >
                              {isLinked && (
                                <Package className="size-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <FormInput
                                className="flex-1"
                                control={form.control}
                                name={`components.${index}.displayName`}
                                placeholder="Nome componente"
                              />
                              <FormInput
                                className="w-16"
                                control={form.control}
                                name={`components.${index}.quantity`}
                                placeholder="Qtà"
                                type="text"
                              />
                              <Button
                                onClick={() => remove(index)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            append({
                              catalogItemId: null,
                              displayName: "",
                              quantity: "1",
                            })
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Plus className="mr-1 size-3.5" />
                          Testo libero
                        </Button>
                        <Button
                          onClick={() => setCatalogPickerOpen(true)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Package className="mr-1 size-3.5" />
                          Dal catalogo
                        </Button>
                      </div>
                    </div>

                    <ScheduleSection form={form} />
                  </>
                ) : null}
              </div>
            </div>

            <SheetFooter className="border-t bg-background px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Annulla
              </Button>
              <Button disabled={isPending} type="submit">
                {isEditing ? "Salva modifiche" : "Crea promozione"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>

      <CatalogItemPickerDialog
        existingCatalogItemIds={new Set()}
        onOpenChange={setCatalogPickerOpen}
        onSelect={handleCatalogItemsSelected}
        open={catalogPickerOpen}
      />
    </Sheet>
  );
}
