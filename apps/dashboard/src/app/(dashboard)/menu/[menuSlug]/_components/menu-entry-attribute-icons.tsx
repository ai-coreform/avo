"use client";

import {
  BeanIcon,
  CoffeeBeansIcon,
  CornIcon,
  CrabIcon,
  EggIcon,
  FireIcon,
  FishFoodIcon,
  FlowerIcon,
  GrapesIcon,
  HalalIcon,
  Leaf01Icon,
  LeafyGreenIcon,
  MilkBottleIcon,
  MilkOatIcon,
  NutIcon,
  OrganicFoodIcon,
  Plant03Icon,
  ShellfishIcon,
  SnowIcon,
  SparklesIcon,
  ThermometerColdIcon,
  ThumbsUpIcon,
  VegetarianFoodIcon,
  WheatIcon,
  WheatOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

function hugeIcon(iconDef: typeof WheatIcon): IconComponent {
  return function WrappedHugeIcon({ className }: { className?: string }) {
    return <HugeiconsIcon className={className} icon={iconDef} />;
  };
}

export const MENU_ENTRY_ALLERGEN_ICONS: Record<string, IconComponent> = {
  Gluten: hugeIcon(WheatIcon),
  Crustaceans: hugeIcon(CrabIcon),
  Eggs: hugeIcon(EggIcon),
  Fish: hugeIcon(FishFoodIcon),
  Peanuts: hugeIcon(NutIcon),
  Soy: hugeIcon(BeanIcon),
  Milk: hugeIcon(MilkBottleIcon),
  TreeNuts: hugeIcon(CoffeeBeansIcon),
  Celery: hugeIcon(LeafyGreenIcon),
  Mustard: hugeIcon(FlowerIcon),
  Sesame: hugeIcon(CornIcon),
  Sulphites: hugeIcon(GrapesIcon),
  Lupins: hugeIcon(Plant03Icon),
  Molluscs: hugeIcon(ShellfishIcon),
};

export const MENU_ENTRY_FEATURE_ICONS: Record<string, IconComponent> = {
  Snowflake: hugeIcon(SnowIcon),
  WheatOff: hugeIcon(WheatOffIcon),
  ThermometerSnowflake: hugeIcon(ThermometerColdIcon),
  Flame: hugeIcon(FireIcon),
  Leaf: hugeIcon(VegetarianFoodIcon),
  Sprout: hugeIcon(Leaf01Icon),
  MilkOff: hugeIcon(MilkOatIcon),
  TreeDeciduous: hugeIcon(OrganicFoodIcon),
  Star: hugeIcon(HalalIcon),
  Sparkles: hugeIcon(SparklesIcon),
  ThumbsUp: hugeIcon(ThumbsUpIcon),
};
