import type { PublicMenuEntry } from "@/api/public-menu/types";

interface IndexedItem {
  entry: PublicMenuEntry;
  name: string;
  description: string;
  metadata: string;
  haystack: string;
  nameWords: string[];
  metadataWords: string[];
}

function normalizeSearchText(value: string | undefined | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
  return value ? value.split(" ") : [];
}

function tokenScore(
  words: string[],
  field: string,
  token: string,
  exactWordPoints: number,
  prefixPoints: number,
  includePoints: number
): number {
  if (words.some((word) => word === token)) {
    return exactWordPoints;
  }
  if (words.some((word) => word.startsWith(token))) {
    return prefixPoints;
  }
  if (field.includes(token)) {
    return includePoints;
  }
  return 0;
}

function scoreItem(
  indexed: IndexedItem,
  normalizedQuery: string,
  queryTokens: string[]
): number | null {
  if (!queryTokens.every((token) => indexed.haystack.includes(token))) {
    return null;
  }

  let score = 0;

  if (indexed.name === normalizedQuery) {
    score += 1000;
  } else if (indexed.name.startsWith(normalizedQuery)) {
    score += 700;
  } else if (indexed.name.includes(normalizedQuery)) {
    score += 450;
  }

  if (indexed.metadata.startsWith(normalizedQuery)) {
    score += 180;
  } else if (indexed.metadata.includes(normalizedQuery)) {
    score += 120;
  }

  if (indexed.description.includes(normalizedQuery)) {
    score += 90;
  }

  for (const token of queryTokens) {
    score += tokenScore(indexed.nameWords, indexed.name, token, 120, 80, 50);
    score += tokenScore(
      indexed.metadataWords,
      indexed.metadata,
      token,
      40,
      24,
      12
    );

    if (indexed.description.includes(token)) {
      score += 16;
    }
  }

  return score;
}

export function buildMenuSearchIndex(
  entries: PublicMenuEntry[]
): IndexedItem[] {
  return entries
    .filter((e) => e.kind === "entry")
    .map((entry) => {
      const name = normalizeSearchText(entry.title);
      const description = normalizeSearchText(entry.description);
      const metadata = normalizeSearchText(
        [...entry.allergens, ...entry.features, ...entry.additives]
          .filter(Boolean)
          .join(" ")
      );

      return {
        entry,
        name,
        description,
        metadata,
        haystack: [name, description, metadata].filter(Boolean).join(" "),
        nameWords: tokenize(name),
        metadataWords: tokenize(metadata),
      };
    });
}

export function searchMenuItems(
  index: IndexedItem[],
  query: string
): PublicMenuEntry[] {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(normalizedQuery);

  if (queryTokens.length === 0) {
    return [];
  }

  return index
    .map((indexed) => ({
      entry: indexed.entry,
      score: scoreItem(indexed, normalizedQuery, queryTokens),
    }))
    .filter(
      (result): result is { entry: PublicMenuEntry; score: number } =>
        result.score != null
    )
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.entry.title.localeCompare(right.entry.title, undefined, {
        sensitivity: "base",
      });
    })
    .map((result) => result.entry);
}
