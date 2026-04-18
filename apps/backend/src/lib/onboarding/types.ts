import type {
  menuAdditiveValues,
  menuAllergenValues,
  menuFeatureValues,
} from "@/db/schema/enum";

export interface ImportedMenuItem {
  title: string;
  description?: string;
  /** Prezzo in euro (come appare sul menù). Convertito in centesimi a tempo di persist. */
  price?: number | null;
  priceLabel?: string;
  allergens?: (typeof menuAllergenValues)[number][];
  features?: (typeof menuFeatureValues)[number][];
  additives?: (typeof menuAdditiveValues)[number][];
}

export interface ImportedMenuGroup {
  title: string;
  items: ImportedMenuItem[];
}

export interface ImportedMenuCategory {
  title: string;
  section: "food" | "drink";
  items?: ImportedMenuItem[];
  groups?: ImportedMenuGroup[];
}

export interface ExtractedMenuPayload {
  categories: ImportedMenuCategory[];
}

export interface MenuImportSummary {
  categoryCount: number;
  groupCount: number;
  itemCount: number;
}

export interface OnboardingImportResult {
  venueId: string;
  venueSlug: string;
  importSummary: MenuImportSummary;
}
