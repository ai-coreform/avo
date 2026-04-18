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
import type { MenuEntityTranslations } from "@/api/menu/types";
import FormInput from "@/components/form/form-input";
import { applyZodFormErrors } from "../_utils/apply-zod-form-errors";
import {
  type MenuTitleSheetFormValues,
  type MenuTitleSheetSubmitValues,
  type MenuTitleSheetValues,
  menuTitleSheetSchema,
} from "../_utils/menu-title-sheet-schema";
import {
  buildLocaleOptions,
  buildMenuEntityTranslations,
  createEmptyMenuSheetTranslations,
  MENU_EDITOR_SOURCE_LOCALE,
} from "../_utils/menu-translations";
import { MenuEntryVisibilityBadge } from "./menu-entry-visibility-badge";
import { MenuLocaleTabs } from "./menu-locale-tabs";

interface MenuTitleSheetValue {
  title: string;
  isVisible: boolean;
  translations?: MenuEntityTranslations;
}

interface MenuTitleSheetProps {
  open: boolean;
  value: MenuTitleSheetValue | null;
  locales: string[];
  fallbackTitle: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: MenuTitleSheetSubmitValues) => void;
}

function getDefaultValues(
  value: MenuTitleSheetValue | null,
  locales: string[]
): MenuTitleSheetFormValues {
  return {
    title: value?.title ?? "",
    isVisible: value?.isVisible ?? true,
    translations: createEmptyMenuSheetTranslations(
      locales,
      value?.translations
    ),
  };
}

export function MenuTitleSheet({
  open,
  value,
  locales,
  fallbackTitle,
  fieldLabel,
  fieldPlaceholder,
  description,
  onOpenChange,
  onSave,
}: MenuTitleSheetProps) {
  const localeOptions = useMemo(() => buildLocaleOptions(locales), [locales]);
  const [activeLocale, setActiveLocale] = useState<string>(
    MENU_EDITOR_SOURCE_LOCALE
  );
  const defaultValues = useMemo(
    () => getDefaultValues(value, locales),
    [value, locales]
  );
  const form = useForm<MenuTitleSheetFormValues, unknown, MenuTitleSheetValues>(
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

  // Reset form when the sheet opens with new data (defaultValues changes).
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.reset is stable — intentionally omitted to avoid spurious resets during editing.
  useEffect(() => {
    form.reset(defaultValues);
    setActiveLocale(MENU_EDITOR_SOURCE_LOCALE);
  }, [defaultValues]);

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
              {title?.trim() || value?.title || fallbackTitle}
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
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <MenuLocaleTabs
          activeLocale={activeLocale}
          locales={localeOptions}
          onChange={setActiveLocale}
        />

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const rawValues = form.getValues();
              const parsedValues = menuTitleSheetSchema.safeParse({
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
              onOpenChange(false);
            }}
          >
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Render ALL locale fields at once and toggle visibility via
                  CSS so that switching tabs never unmounts a field. This
                  guarantees React Hook Form preserves every value. */}
              <div
                className={
                  activeLocale === MENU_EDITOR_SOURCE_LOCALE
                    ? undefined
                    : "hidden"
                }
              >
                <FormInput
                  autoComplete="off"
                  control={form.control}
                  label={fieldLabel}
                  name="title"
                  placeholder={fieldPlaceholder}
                  required
                />
              </div>
              {localeOptions
                .filter((locale) => locale.code !== MENU_EDITOR_SOURCE_LOCALE)
                .map((locale) => (
                  <div
                    className={
                      activeLocale === locale.code ? undefined : "hidden"
                    }
                    key={locale.code}
                  >
                    <FormInput
                      autoComplete="off"
                      control={form.control}
                      label={fieldLabel}
                      name={`translations.${locale.code}.title`}
                      placeholder="Non ancora tradotto"
                    />
                  </div>
                ))}
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
