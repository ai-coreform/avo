import { LANGUAGE_NAMES } from "@/data/locale-configs";
import database from "@/db";
import { contentTranslation } from "@/db/schema/content-translation";
import { aiService } from "@/lib/ai";

const MAX_RETRIES = 2;
const MODEL = "google/gemini-2.5-flash";
const MAX_TOKENS = 4096;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

interface TranslationFields {
  [fieldName: string]: string | null | undefined;
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(JSON_OBJECT_PATTERN);
  if (!match) {
    throw new Error("Model response does not contain valid JSON");
  }

  return match[0];
}

function buildTranslationPrompt(
  italianFields: TranslationFields,
  context: string,
  targetLocales: string[]
) {
  const fieldsToTranslate = Object.entries(italianFields).filter(
    ([, val]) => val && val.trim().length > 0
  );

  if (fieldsToTranslate.length === 0) {
    return null;
  }

  const fieldDescriptions = fieldsToTranslate
    .map(([key, val]) => `- ${key}: ${JSON.stringify(val)}`)
    .join("\n");

  const fieldKeys = fieldsToTranslate.map(([key]) => key);
  const fieldExample = fieldKeys.map((key) => `"${key}": "..."`).join(", ");
  const languageList = targetLocales
    .map((l) => LANGUAGE_NAMES[l] ?? l)
    .join(", ");

  return `You are an expert translator for a restaurant's digital menu. Translate the following Italian text fields into ${languageList}.

Context: ${context}

Fields to translate:
${fieldDescriptions}

TRANSLATION STRATEGY — classify each piece of text and apply the right approach:

1. KEEP IDENTICAL across all languages:
   - Universal food/drink names recognized worldwide: tiramisù, bruschetta, Negroni, Aperol Spritz, donuts, hamburger, cocktail, prosecco
   - Proper names and branded menu item names: "La Romagnola", "La Tradizionale", "Il Classico" — these are fixed names chosen by the restaurant, never translate them
   - Italian dish names used internationally: pizza, focaccia, piadina, cappuccino, espresso, latte

2. PARTIAL TRANSLATION — translate the descriptors, keep the food noun in Italian:
   - "tagliere piccolo" → EN: "small tagliere" (translate "piccolo", keep "tagliere")
   - "birra artigianale" → EN: "craft beer" (beer is universal enough to translate fully)
   - "insalata mista" → EN: "mixed salad"

3. FULL TRANSLATION — translate everything naturally:
   - Descriptive text and ingredient lists: "mozzarella impanate e fritte" → EN: "breaded and fried mozzarella"
   - Descriptions: "servito con contorno di verdure grigliate" → EN: "served with grilled vegetable side"
   - Category names that are generic: "Antipasti" → EN: "Starters", "Bevande" → EN: "Beverages"
   - Group names that are descriptive: "Vini Rossi" → EN: "Red Wines"

4. PRICE LABELS — translate measurement context:
   - "cad." → EN: "each", FR: "pièce", ES: "ud.", DE: "Stk.", PT: "un."
   - "/hg" → keep as "/hg" in all languages (metric unit)
   - "al kg" → EN: "per kg"

KEY PRINCIPLES:
- When in doubt about a food name, keep the Italian original — it adds authenticity
- For descriptions, be natural in each target language, not word-for-word literal
- If a title IS a proper name (like a piadina name), keep it identical in ALL languages

Return ONLY valid JSON with this exact structure:
{
  ${targetLocales.map((l) => `"${l}": { ${fieldExample} }`).join(",\n  ")}
}`;
}

/**
 * Translates Italian text fields to target languages and persists
 * the translations to the content_translation table.
 */
export async function translateAndPersist(
  venueId: string,
  entityType: string,
  entityId: string,
  italianFields: TranslationFields,
  context: string,
  targetLocales: string[]
): Promise<void> {
  const locales = targetLocales.filter((locale) => locale !== "it");
  if (locales.length === 0) {
    return;
  }

  const prompt = buildTranslationPrompt(italianFields, context, locales);
  if (!prompt) {
    return;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await aiService.chatCompletion({
        model: MODEL,
        maxTokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      });

      if (!text) {
        continue;
      }

      const translations = JSON.parse(extractJsonObject(text)) as Record<
        string,
        Record<string, string>
      >;

      // Verify all requested locales are present
      const missingLocales = locales.filter((l) => !translations[l]);
      if (missingLocales.length > 0 && attempt < MAX_RETRIES) {
        continue;
      }

      // Persist translations
      for (const locale of locales) {
        const fields = translations[locale];
        if (!fields) {
          continue;
        }

        await database
          .insert(contentTranslation)
          .values({
            venueId,
            entityType: entityType as "menu_entry",
            entityId,
            locale,
            fieldsJson: fields,
            sourceLocale: "it",
            sourceRevision: 1,
            status: "published",
            translatedBy: "system",
          })
          .onConflictDoUpdate({
            target: [
              contentTranslation.entityType,
              contentTranslation.entityId,
              contentTranslation.locale,
            ],
            set: {
              fieldsJson: fields,
              status: "published",
              translatedBy: "system",
            },
          });
      }

      return;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        console.error(
          `[translate] Failed to translate ${entityType}/${entityId} after ${MAX_RETRIES + 1} attempts:`,
          error
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to translate ${entityType}/${entityId}`);
}
