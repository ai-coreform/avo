import { z } from "zod";
import {
  menuAdditiveValues,
  menuAllergenValues,
  menuFeatureValues,
} from "@/db/schema/enum";
import { aiService } from "@/lib/ai";
import type {
  ExtractedMenuPayload,
  ImportedMenuCategory,
  ImportedMenuGroup,
  ImportedMenuItem,
} from "./types";

// ---------------------------------------------------------------------------
// Source types
// ---------------------------------------------------------------------------

type MenuPdf = { filename?: string } & ({ url: string } | { data: Uint8Array });

interface MenuSources {
  imageUrls?: string[];
  pdfs?: MenuPdf[];
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const validAllergens = new Set<string>(menuAllergenValues);
const validFeatures = new Set<string>(menuFeatureValues);
const validAdditives = new Set<string>(menuAdditiveValues);

function filterValidIds<T extends string>(
  ids: unknown,
  validSet: Set<string>
): T[] | undefined {
  if (!Array.isArray(ids)) {
    return undefined;
  }
  const valid = ids.filter(
    (id): id is T => typeof id === "string" && validSet.has(id)
  );
  return valid.length > 0 ? valid : undefined;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeSection(value: string): "food" | "drink" | null {
  const n = value.trim().toLowerCase();
  if (["food", "foods", "cibo", "piatti", "kitchen"].includes(n)) {
    return "food";
  }
  if (
    ["drink", "drinks", "beverage", "beverages", "bevande", "bar"].includes(n)
  ) {
    return "drink";
  }
  return null;
}

function normalizeItem(
  item: Partial<ImportedMenuItem>
): ImportedMenuItem | null {
  const title = item.title?.trim();
  if (!title) {
    return null;
  }

  return {
    title,
    description: item.description?.trim() || undefined,
    price:
      typeof item.price === "number" && Number.isFinite(item.price)
        ? item.price
        : undefined,
    priceLabel: item.priceLabel?.trim() || undefined,
    allergens: filterValidIds<(typeof menuAllergenValues)[number]>(
      item.allergens,
      validAllergens
    ),
    features: filterValidIds<(typeof menuFeatureValues)[number]>(
      item.features,
      validFeatures
    ),
    additives: filterValidIds<(typeof menuAdditiveValues)[number]>(
      item.additives,
      validAdditives
    ),
  };
}

function mergeGroups(groups: ImportedMenuGroup[]): ImportedMenuGroup[] {
  const merged = new Map<string, ImportedMenuGroup>();

  for (const group of groups) {
    const title = group.title.trim();
    if (!title) {
      continue;
    }

    const key = title.toLowerCase();
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { title, items: [...group.items] });
      continue;
    }

    existing.items.push(...group.items);
  }

  return Array.from(merged.values());
}

export function normalizeMenu(raw: unknown): ExtractedMenuPayload {
  const categories = Array.isArray(
    (raw as { categories?: unknown[] })?.categories
  )
    ? (raw as { categories: Partial<ImportedMenuCategory>[] }).categories
    : [];

  const mergedCategories = new Map<string, ImportedMenuCategory>();

  for (const category of categories) {
    const title = category.title?.trim();
    const section = category.section
      ? normalizeSection(category.section)
      : null;
    if (!(title && section)) {
      continue;
    }

    const directItems = Array.isArray(category.items)
      ? category.items
          .map(normalizeItem)
          .filter((item): item is ImportedMenuItem => item !== null)
      : [];

    const groups = Array.isArray(category.groups)
      ? category.groups
          .map((group) => {
            const groupTitle = group.title?.trim();
            if (!(groupTitle && Array.isArray(group.items))) {
              return null;
            }

            const items = group.items
              .map(normalizeItem)
              .filter((item): item is ImportedMenuItem => item !== null);

            if (items.length === 0) {
              return null;
            }
            return { title: groupTitle, items };
          })
          .filter((g): g is ImportedMenuGroup => g !== null)
      : [];

    if (directItems.length === 0 && groups.length === 0) {
      continue;
    }

    const key = `${section}:${title.toLowerCase()}`;
    const existing = mergedCategories.get(key);

    if (!existing) {
      mergedCategories.set(key, {
        title,
        section,
        items: directItems,
        groups: mergeGroups(groups),
      });
      continue;
    }

    existing.items = [...(existing.items ?? []), ...directItems];
    existing.groups = mergeGroups([...(existing.groups ?? []), ...groups]);
  }

  const normalizedCategories = Array.from(mergedCategories.values()).map(
    (cat) => ({
      ...cat,
      items: cat.items?.length ? cat.items : undefined,
      groups: cat.groups?.length ? cat.groups : undefined,
    })
  );

  if (normalizedCategories.length === 0) {
    throw new Error("Could not extract a valid menu from the provided sources");
  }

  return { categories: normalizedCategories };
}

// ---------------------------------------------------------------------------
// AI extraction schema
// ---------------------------------------------------------------------------

const allergenIds = [...menuAllergenValues] as [string, ...string[]];
const featureIds = [...menuFeatureValues] as [string, ...string[]];
const additiveIds = [...menuAdditiveValues] as [string, ...string[]];

const menuItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  price: z
    .number()
    .optional()
    .describe(
      "Numeric price in euros (e.g. 9.50). Do not include currency symbols."
    ),
  priceLabel: z
    .string()
    .optional()
    .describe(
      'Unit or qualifier for the price, e.g. "all\'hg", "al kg", "cad.", "a persona", "al litro". Do NOT repeat the numeric price here. Leave empty if no unit applies.'
    ),
  allergens: z
    .array(z.enum(allergenIds))
    .describe(
      "Required. Allergens based on typical recipe or listed ingredients."
    ),
  features: z
    .array(z.enum(featureIds))
    .optional()
    .describe(
      "Characteristics like vegetarian, vegan, spicy, frozen, etc. Include when confidently deducible."
    ),
  additives: z.array(z.enum(additiveIds)).optional(),
});

const menuGroupSchema = z.object({
  title: z.string(),
  items: z.array(menuItemSchema),
});

const menuSchema = z.object({
  categories: z.array(
    z.object({
      title: z.string(),
      section: z.enum(["food", "drink"]),
      items: z.array(menuItemSchema).optional(),
      groups: z.array(menuGroupSchema).optional(),
    })
  ),
});

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Extract a restaurant menu from one or more sources belonging to the same restaurant. Sources may include photographed menu images and PDF menu files. Keep the original language. Never invent categories, groups, prices, or descriptions. Omit uncertain fields instead of guessing. Merge all pages into one final menu without duplicating repeated headers or repeated items. Include only categories that contain at least one item. The only allowed section values are "food" and "drink". Preserve the source order as much as possible.

Categories vs groups:
- A "category" is a top-level tab (e.g. "Antipasti", "Primi", "Pizze", "Vini Rossi", "Cocktails").
- A "group" is a sub-section within a category, used to organize items when there is a natural subdivision.
- Use groups when the menu shows clear sub-headings within a section. For example:
  - A "Vini Rossi" category could have groups by region: "Toscana", "Lazio", "Campania", "Piemonte".
  - A "Pizze" category could have groups like "Pizze Classiche" and "Pizze Speciali".
  - A "Birre" category could have groups like "Alla Spina" and "In Bottiglia".
- Do NOT overuse groups. If a category just has a flat list of items with no sub-headings, use "items" directly without groups.
- Only create groups when the menu itself shows the subdivision, or when the items clearly belong to distinct sub-categories that would help organize the menu.

ALLERGENS ARE MANDATORY. EU Regulation 1169/2011 requires allergens on every menu item. For every single item, you MUST populate the "allergens" array. Use ONLY these IDs:

Allergens: ${allergenIds.join(", ")}
Features: ${featureIds.join(", ")}
Additives: ${additiveIds.join(", ")}

Allergen rules:
- Do NOT read allergen icons, symbols, numbers, or legends from the menu image. They are unreliable.
- Use your own knowledge: if the dish is well-known (e.g. "Carbonara" = egg, milk, gluten; "Caprese" = milk), assign allergens from the standard recipe.
- If the description lists ingredients, deduce allergens from those.
- Only leave the array empty if the dish name is truly unrecognizable AND there is no description. This should be rare.
- When in doubt, include the allergen. It is better to over-report than under-report.

Feature/characteristic rules (${featureIds.join(", ")}):
- Infer features when you can confidently determine them from the dish. For example: a dish called "Insalata Vegana" is vegan; "Penne all'Arrabbiata" is spicy if described with peperoncino.
- Only add a feature when you are confident it applies. Do not add features you are unsure about.

Additive rules:
- Only include additives if the menu explicitly marks them. Do not infer additives.`;

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

function getMenuImportModel(): string {
  return process.env.OPENROUTER_MENU_IMPORT_MODEL ?? "google/gemini-2.5-flash";
}

export async function extractMenuFromSources({
  imageUrls = [],
  pdfs = [],
}: MenuSources): Promise<ExtractedMenuPayload> {
  if (imageUrls.length === 0 && pdfs.length === 0) {
    throw new Error("At least one menu source is required");
  }

  const object = await aiService.generateObject({
    model: getMenuImportModel(),
    schema: menuSchema,
    providerOptions: {
      openrouter: {
        plugins: [
          { id: "response-healing" },
          ...(pdfs.length > 0
            ? [
                {
                  id: "file-parser" as const,
                  pdf: { engine: "native" as const },
                },
              ]
            : []),
        ],
      },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the menu from all attached sources. Use all images and PDFs together as one restaurant menu.",
          },
          ...imageUrls.map((url) => ({ type: "image" as const, image: url })),
          ...pdfs.map((pdf) => ({
            type: "file" as const,
            data: "data" in pdf ? pdf.data : pdf.url,
            mediaType: "application/pdf",
            filename: pdf.filename ?? "menu.pdf",
          })),
        ],
      },
    ],
  });

  return normalizeMenu(object);
}
