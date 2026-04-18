import type {
  menuAdditiveValues,
  menuAllergenValues,
  menuEntryKind,
  menuFeatureValues,
  menuStatus,
} from "@/db/schema/enum";
import { type MenuRecord, serializeMenu } from "@/operations/menu/shared";
import type { MenuEditorTranslations } from "./translations";

export type MenuEditorMenuStatus = (typeof menuStatus.enumValues)[number];
export type MenuEditorRowKind = (typeof menuEntryKind.enumValues)[number];
export type MenuEditorAllergen = (typeof menuAllergenValues)[number];
export type MenuEditorFeature = (typeof menuFeatureValues)[number];
export type MenuEditorAdditive = (typeof menuAdditiveValues)[number];

export interface MenuEditorGroupRow {
  kind: "group";
  id: string | null;
  title: string;
  isVisible: boolean;
  translations: MenuEditorTranslations;
}

export interface MenuEditorEntryRow {
  kind: "entry";
  id: string | null;
  catalogItemId: string | null;
  isShared: boolean;
  title: string;
  description: string | null;
  priceCents: number | null;
  priceLabel: string | null;
  allergens: MenuEditorAllergen[];
  features: MenuEditorFeature[];
  additives: MenuEditorAdditive[];
  imageUrl: string | null;
  isVisible: boolean;
  priceCentsOverride: number | null;
  priceLabelOverride: string | null;
  translations: MenuEditorTranslations;
}

export type MenuEditorRow = MenuEditorGroupRow | MenuEditorEntryRow;

export interface MenuEditorCategory {
  id: string | null;
  title: string;
  isVisible: boolean;
  translations: MenuEditorTranslations;
  rows: MenuEditorRow[];
}

export interface MenuEditorTab {
  id: string | null;
  label: string;
  slug: string;
  isVisible: boolean;
  translations: MenuEditorTranslations;
  categories: MenuEditorCategory[];
}

export interface MenuEditorData {
  menu: ReturnType<typeof serializeMenu>;
  tabs: MenuEditorTab[];
  locales: string[];
}

export function serializeMenuEditorMenu(menu: MenuRecord) {
  return serializeMenu(menu);
}
