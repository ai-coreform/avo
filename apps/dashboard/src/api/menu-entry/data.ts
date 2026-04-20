import type { MenuEditorEntryRow } from "@/api/menu/types";
import { ADDITIVES, ALLERGENS, FEATURES } from "@/data/allergens";
import type { Option } from "@/types/misc";

export type MenuEntryAllergen = MenuEditorEntryRow["allergens"][number];
export type MenuEntryFeature = MenuEditorEntryRow["features"][number];
export type MenuEntryAdditive = MenuEditorEntryRow["additives"][number];

export const menuEntryAllergenValues = ALLERGENS.map(
  (allergen) => allergen.id
) as [MenuEntryAllergen, ...MenuEntryAllergen[]];

export const menuEntryFeatureValues = FEATURES.map((feature) => feature.id) as [
  MenuEntryFeature,
  ...MenuEntryFeature[],
];

export const menuEntryAdditiveValues = ADDITIVES.map(
  (additive) => additive.id
) as [MenuEntryAdditive, ...MenuEntryAdditive[]];

export const menuEntryAllergenMeta = Object.fromEntries(
  ALLERGENS.map((allergen) => [
    allergen.id,
    {
      label: allergen.label,
    },
  ])
) as Record<MenuEntryAllergen, { label: string }>;

export const menuEntryFeatureMeta = Object.fromEntries(
  FEATURES.map((feature) => [
    feature.id,
    {
      label: feature.label,
    },
  ])
) as Record<MenuEntryFeature, { label: string }>;

export const menuEntryAdditiveMeta = Object.fromEntries(
  ADDITIVES.map((additive) => [
    additive.id,
    {
      label: additive.label,
    },
  ])
) as Record<MenuEntryAdditive, { label: string }>;

export const menuEntryAllergenOptions: Option[] = ALLERGENS.map((allergen) => ({
  value: allergen.id,
  label: allergen.label,
}));

export const menuEntryFeatureOptions: Option[] = FEATURES.map((feature) => ({
  value: feature.id,
  label: feature.label,
}));

export const menuEntryAdditiveOptions: Option[] = ADDITIVES.map((additive) => ({
  value: additive.id,
  label: additive.label,
}));
