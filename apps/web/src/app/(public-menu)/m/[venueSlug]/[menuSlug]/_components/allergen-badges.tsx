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
import { Info } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import {
  ADDITIVE_MAP,
  ALLERGEN_MAP,
  FEATURE_MAP,
} from "../_utils/allergen-data";

type IconDef = typeof WheatIcon;
type IconComponent = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

function hugeIcon(iconDef: IconDef): IconComponent {
  const Wrapper = ({
    className,
    style,
  }: {
    className?: string;
    style?: React.CSSProperties;
  }) => <HugeiconsIcon className={className} icon={iconDef} style={style} />;
  return Wrapper;
}

const ALLERGEN_ICONS: Record<string, IconComponent> = {
  gluten: hugeIcon(WheatIcon),
  crustaceans: hugeIcon(CrabIcon),
  egg: hugeIcon(EggIcon),
  fish: hugeIcon(FishFoodIcon),
  peanut: hugeIcon(NutIcon),
  soy: hugeIcon(BeanIcon),
  milk: hugeIcon(MilkBottleIcon),
  nuts: hugeIcon(CoffeeBeansIcon),
  celery: hugeIcon(LeafyGreenIcon),
  mustard: hugeIcon(FlowerIcon),
  sesame: hugeIcon(CornIcon),
  sulfites: hugeIcon(GrapesIcon),
  lupins: hugeIcon(Plant03Icon),
  shellfish: hugeIcon(ShellfishIcon),
};

const FEATURE_ICON_MAP: Record<string, IconDef> = {
  frozen: SnowIcon,
  gluten_free: WheatOffIcon,
  blast_chilled: ThermometerColdIcon,
  spicy: FireIcon,
  vegetarian: VegetarianFoodIcon,
  vegan: Leaf01Icon,
  lactose_free: MilkOatIcon,
  organic: OrganicFoodIcon,
  halal: HalalIcon,
  new: SparklesIcon,
  recommended: ThumbsUpIcon,
};

function AllergenCircle({ id }: { id: string }) {
  const allergen = ALLERGEN_MAP[id];
  if (!allergen) {
    return null;
  }

  const Icon = ALLERGEN_ICONS[id];

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-label={allergen.label}
          className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full leading-none transition-transform hover:scale-110"
          style={{
            backgroundColor: "var(--menu-allergen, #B1693A)",
            color: "var(--menu-allergen-icon, #FFFFFF)",
          }}
          type="button"
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : allergen.number}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="fade-in-0 zoom-in-95 z-50 animate-in rounded-md bg-zinc-900 px-2.5 py-1.5 font-sans text-white text-xs shadow-lg"
          side="top"
          sideOffset={6}
        >
          {allergen.label}
          <PopoverPrimitive.Arrow className="fill-zinc-900" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function FeatureIcon({ id }: { id: string }) {
  const feature = FEATURE_MAP[id];
  if (!feature) {
    return null;
  }

  const iconDef = FEATURE_ICON_MAP[id];
  if (!iconDef) {
    return null;
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-label={feature.label}
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center transition-all hover:scale-110"
          style={{ color: "var(--menu-text, inherit)", opacity: 0.4 }}
          type="button"
        >
          <HugeiconsIcon className="h-4.5 w-4.5" icon={iconDef} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="fade-in-0 zoom-in-95 z-50 animate-in rounded-md bg-zinc-900 px-2.5 py-1.5 font-sans text-white text-xs shadow-lg"
          side="top"
          sideOffset={6}
        >
          {feature.label}
          <PopoverPrimitive.Arrow className="fill-zinc-900" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function AdditiveInfo({ additiveIds }: { additiveIds: string[] }) {
  const [open, setOpen] = useState(false);
  const items = additiveIds.map((id) => ADDITIVE_MAP[id]).filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <PopoverPrimitive.Root onOpenChange={setOpen} open={open}>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-label="Additivi"
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center transition-all hover:scale-110"
          style={{ color: "var(--menu-text, inherit)", opacity: 0.4 }}
          type="button"
        >
          <Info className="h-4.5 w-4.5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="fade-in-0 zoom-in-95 z-50 max-w-[200px] animate-in rounded-md bg-zinc-900 px-3 py-2 font-sans text-white text-xs shadow-lg"
          side="top"
          sideOffset={6}
        >
          <div className="space-y-0.5">
            {items.map((item) => (
              <div key={item.id}>{item.label}</div>
            ))}
          </div>
          <PopoverPrimitive.Arrow className="fill-zinc-900" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

interface AllergenBadgesProps {
  allergens: string[];
  features: string[];
  additives: string[];
}

export function AllergenBadges({
  allergens,
  features,
  additives,
}: AllergenBadgesProps) {
  if (
    allergens.length === 0 &&
    features.length === 0 &&
    additives.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-1">
      {allergens.map((id) => (
        <AllergenCircle id={id} key={id} />
      ))}
      {features.map((id) => (
        <FeatureIcon id={id} key={id} />
      ))}
      {additives.length > 0 && <AdditiveInfo additiveIds={additives} />}
    </div>
  );
}
