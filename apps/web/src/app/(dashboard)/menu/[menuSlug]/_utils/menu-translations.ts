import type { MenuEntityTranslations } from "@/api/menu/types";
import { getLocaleConfig } from "@/data/locale-configs";

export const MENU_EDITOR_SOURCE_LOCALE = "it" as const;

export interface MenuEditorLocaleOption {
  code: string;
  flag: string;
  label: string;
  shortLabel: string;
}

export interface MenuSheetTranslationValue {
  title: string;
  description: string;
}

export type MenuSheetTranslations = Record<string, MenuSheetTranslationValue>;

type MenuSheetTranslationsInput = Partial<
  Record<
    string,
    Partial<{
      title: string | null | undefined;
      description: string | null | undefined;
    }>
  >
>;

/**
 * Builds locale tab options from dynamic locale codes.
 * The source locale (IT) is always first.
 */
export function buildLocaleOptions(
  secondaryLocales: string[]
): MenuEditorLocaleOption[] {
  const sourceConfig = getLocaleConfig(MENU_EDITOR_SOURCE_LOCALE);
  const options: MenuEditorLocaleOption[] = [
    {
      code: MENU_EDITOR_SOURCE_LOCALE,
      flag: sourceConfig?.flag ?? "🇮🇹",
      label: sourceConfig?.name ?? "Italiano",
      shortLabel: "Primaria",
    },
  ];

  for (const locale of secondaryLocales) {
    const config = getLocaleConfig(locale);
    if (config) {
      options.push({
        code: config.code,
        flag: config.flag,
        label: config.name,
        shortLabel: config.code.toUpperCase(),
      });
    }
  }

  return options;
}

export function createEmptyMenuSheetTranslations(
  locales: string[],
  translations?: MenuEntityTranslations | MenuSheetTranslationsInput | null
): MenuSheetTranslations {
  const result: MenuSheetTranslations = {};

  for (const locale of locales) {
    result[locale] = {
      title: translations?.[locale]?.title ?? "",
      description: translations?.[locale]?.description ?? "",
    };
  }

  return result;
}

export function buildMenuEntityTranslations(
  translations: MenuSheetTranslations | MenuSheetTranslationsInput
): MenuEntityTranslations {
  const result: MenuEntityTranslations = {};

  for (const [locale, translation] of Object.entries(translations)) {
    if (!translation) {
      continue;
    }

    const title = (translation.title ?? "").trim();
    const description = (translation.description ?? "").trim();

    if (!(title || description)) {
      continue;
    }

    result[locale] = {
      title: title || null,
      description: description || null,
    };
  }

  return result;
}
