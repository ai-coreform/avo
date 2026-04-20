"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@avo/ui/components/ui/sheet";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormTextArea from "@/components/form/form-textarea";
import { ImageUpload } from "@/components/image-upload";
import { ADDITIVES, ALLERGENS, FEATURES } from "@/data/allergens";
import { applyZodFormErrors } from "../_utils/apply-zod-form-errors";
import type { LocalMenuEditorEntryRow } from "../_utils/menu-editor-state";
import {
  type MenuEntrySheetFormValues,
  type MenuEntrySheetSubmitValues,
  type MenuEntrySheetValues,
  menuEntrySheetSchema,
} from "../_utils/menu-entry-sheet-schema";
import {
  buildLocaleOptions,
  buildMenuEntityTranslations,
  createEmptyMenuSheetTranslations,
  MENU_EDITOR_SOURCE_LOCALE,
} from "../_utils/menu-translations";
import {
  MENU_ENTRY_ALLERGEN_ICONS,
  MENU_ENTRY_FEATURE_ICONS,
} from "./menu-entry-attribute-icons";
import { MenuEntryMultiSelectField } from "./menu-entry-multi-select-field";
import { MenuEntryVisibilityBadge } from "./menu-entry-visibility-badge";
import { MenuLocaleTabs } from "./menu-locale-tabs";

interface MenuEntrySheetProps {
  open: boolean;
  entry: LocalMenuEditorEntryRow | null;
  locales: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: MenuEntrySheetSubmitValues) => Promise<void> | void;
}

function getDefaultValues(
  entry: LocalMenuEditorEntryRow | null,
  locales: string[]
): MenuEntrySheetFormValues {
  return {
    title: entry?.title ?? "",
    description: entry?.description ?? "",
    priceCents: entry?.priceCents ?? "",
    priceLabel: entry?.priceLabel ?? "",
    isVisible: entry?.isVisible ?? true,
    allergens: entry?.allergens ?? [],
    features: entry?.features ?? [],
    additives: entry?.additives ?? [],
    imageUrl: entry?.imageUrl ?? null,
    translations: createEmptyMenuSheetTranslations(
      locales,
      entry?.translations
    ),
  };
}

const allergenOptions = ALLERGENS.map((allergen) => ({
  id: allergen.id,
  label: allergen.label,
  icon: MENU_ENTRY_ALLERGEN_ICONS[allergen.icon],
}));

const featureOptions = FEATURES.map((feature) => ({
  id: feature.id,
  label: feature.label,
  icon: MENU_ENTRY_FEATURE_ICONS[feature.icon],
}));

const additiveOptions = ADDITIVES.map((additive) => ({
  id: additive.id,
  label: additive.label,
}));

export function MenuEntrySheet({
  open,
  entry,
  locales,
  onOpenChange,
  onSave,
}: MenuEntrySheetProps) {
  const _isLinkedEntry = Boolean(entry?.catalogItemId);
  const localeOptions = useMemo(() => buildLocaleOptions(locales), [locales]);
  const [activeLocale, setActiveLocale] = useState<string>(
    MENU_EDITOR_SOURCE_LOCALE
  );
  const defaultValues = useMemo(
    () => getDefaultValues(entry, locales),
    [entry, locales]
  );
  const form = useForm<MenuEntrySheetFormValues, unknown, MenuEntrySheetValues>(
    {
      defaultValues,
      shouldUnregister: false,
    }
  );
  const title = useWatch({
    control: form.control,
    name: "title",
  });
  const isVisible = useWatch({
    control: form.control,
    name: "isVisible",
  });

  useEffect(() => {
    form.reset(defaultValues);
    setActiveLocale(MENU_EDITOR_SOURCE_LOCALE);
  }, [defaultValues, form]);

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
              {title?.trim() || entry?.title || "Nuova voce"}
            </SheetTitle>
            <MenuEntryVisibilityBadge
              isVisible={Boolean(isVisible)}
              onToggle={(nextVisible) =>
                form.setValue("isVisible", nextVisible, {
                  shouldDirty: true,
                })
              }
            />
          </div>
          <SheetDescription className="sr-only">
            Modifica la voce del menu e le sue informazioni aggiuntive.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const rawValues = form.getValues();
              const parsedValues = menuEntrySheetSchema.safeParse({
                ...defaultValues,
                ...rawValues,
                translations: {
                  ...defaultValues.translations,
                  ...rawValues.translations,
                },
              });

              if (!parsedValues.success) {
                applyZodFormErrors(form, parsedValues.error);
                return;
              }

              form.clearErrors();
              onSave({
                ...parsedValues.data,
                translations: buildMenuEntityTranslations(
                  parsedValues.data.translations
                ),
              });
            }}
          >
            <MenuLocaleTabs
              activeLocale={activeLocale}
              locales={localeOptions}
              onChange={setActiveLocale}
            />
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {activeLocale === MENU_EDITOR_SOURCE_LOCALE ? (
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
                      label="Nome"
                      name="title"
                      placeholder="es. Margherita"
                      required
                    />
                    <FormTextArea
                      control={form.control}
                      label="Descrizione"
                      name="description"
                      placeholder="es. Pomodoro, mozzarella, basilico"
                      rows={4}
                    />
                  </>
                ) : (
                  <>
                    <FormInput
                      autoComplete="off"
                      control={form.control}
                      label="Nome"
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

                {activeLocale === MENU_EDITOR_SOURCE_LOCALE ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput
                        control={form.control}
                        inputMode="decimal"
                        label="Prezzo (€)"
                        name="priceCents"
                        placeholder="20.00"
                      />
                      <FormInput
                        control={form.control}
                        label="Etichetta prezzo"
                        name="priceLabel"
                        placeholder="/hg, cad."
                      />
                    </div>

                    <div className="space-y-4 border-t pt-5">
                      <div>
                        <h3 className="font-medium text-base">
                          Informazioni aggiuntive
                        </h3>
                      </div>
                      <MenuEntryMultiSelectField
                        control={form.control}
                        iconCircle
                        label="Allergeni"
                        name="allergens"
                        options={allergenOptions}
                        placeholder="Seleziona allergeni..."
                        themeColor="#3B82F6"
                      />
                      <MenuEntryMultiSelectField
                        control={form.control}
                        label="Caratteristiche"
                        name="features"
                        options={featureOptions}
                        placeholder="Seleziona caratteristiche..."
                        themeColor="#8B5CF6"
                      />
                      <MenuEntryMultiSelectField
                        control={form.control}
                        label="Additivi"
                        name="additives"
                        options={additiveOptions}
                        placeholder="Seleziona additivi..."
                        themeColor="#EC4899"
                      />
                    </div>
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
              <Button type="submit">Salva</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
