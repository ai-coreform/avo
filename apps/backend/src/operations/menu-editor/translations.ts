import type { contentTranslation } from "@/db/schema/content-translation";

export type MenuTranslationEntityType =
  | "menu_tab"
  | "menu_category"
  | "menu_entry";

export interface MenuEditorTranslationFields {
  title: string | null;
  description: string | null;
}

export type MenuEditorTranslations = Record<
  string,
  MenuEditorTranslationFields
>;

type ContentTranslationInsert = typeof contentTranslation.$inferInsert;

interface ContentTranslationRow {
  entityType: MenuTranslationEntityType;
  entityId: string;
  locale: string;
  fieldsJson: Record<string, string | null>;
}

function normalizeTranslationValue(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTranslationFields(
  fields: Partial<MenuEditorTranslationFields> | null | undefined
) {
  const normalized = {
    title: normalizeTranslationValue(fields?.title),
    description: normalizeTranslationValue(fields?.description),
  };

  if (!(normalized.title || normalized.description)) {
    return null;
  }

  return normalized;
}

export function getMenuEditorTranslationKey(
  entityType: MenuTranslationEntityType,
  entityId: string
) {
  return `${entityType}:${entityId}`;
}

export function buildMenuEditorTranslationsMap(rows: ContentTranslationRow[]) {
  const map = new Map<string, MenuEditorTranslations>();

  for (const row of rows) {
    // Skip the source locale (it)
    if (row.locale === "it") {
      continue;
    }

    const normalizedFields = normalizeTranslationFields(row.fieldsJson);
    if (!normalizedFields) {
      continue;
    }

    const key = getMenuEditorTranslationKey(row.entityType, row.entityId);
    const currentTranslations = map.get(key) ?? {};
    currentTranslations[row.locale] = normalizedFields;
    map.set(key, currentTranslations);
  }

  return map;
}

export function getMenuEditorTranslations(
  translationsMap: Map<string, MenuEditorTranslations>,
  entityType: MenuTranslationEntityType,
  entityId: string
) {
  return (
    translationsMap.get(getMenuEditorTranslationKey(entityType, entityId)) ?? {}
  );
}

export function createMenuEditorTranslationInserts(params: {
  venueId: string;
  entityType: MenuTranslationEntityType;
  entityId: string;
  translations: MenuEditorTranslations;
  sourceLocale?: string;
  sourceRevision?: number;
}) {
  const {
    venueId,
    entityType,
    entityId,
    translations,
    sourceLocale = "it",
    sourceRevision = 1,
  } = params;

  return Object.entries(translations).flatMap<ContentTranslationInsert>(
    ([locale, fields]) => {
      // Skip the source locale
      if (locale === sourceLocale) {
        return [];
      }

      const normalized = normalizeTranslationFields(fields);
      if (!normalized) {
        return [];
      }

      return [
        {
          venueId,
          entityType,
          entityId,
          locale,
          fieldsJson: normalized,
          sourceLocale,
          sourceRevision,
          status: "published",
          translatedBy: "manual",
        },
      ];
    }
  );
}
