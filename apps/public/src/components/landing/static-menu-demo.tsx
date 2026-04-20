"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
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
  Leaf01Icon,
  LeafyGreenIcon,
  MilkBottleIcon,
  MilkOatIcon,
  NutIcon,
  OrganicFoodIcon,
  Plant03Icon,
  ShellfishIcon,
  SparklesIcon,
  VegetarianFoodIcon,
  WheatIcon,
  WheatOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { MenuTheme } from "@/lib/menu-theme";
import {
  getFontFamily,
  MenuThemeProvider,
  THEME_PRESETS,
  themeToCSS,
} from "@/lib/menu-theme";
import type { MenuItem } from "@/types/menu";

/* ─── Dummy data ─── */

const DEMO_THEME: MenuTheme = {
  ...THEME_PRESETS[1].colors, // "Classico" preset
  logoSize: 32,
  fontDisplay: "bricolage-grotesque",
  fontBody: "dm-sans",
  logoUrl: null,
};

type Section = "promos" | "mangiare" | "bere";

interface Category {
  id: string;
  name: string;
  slug: string;
  section: "mangiare" | "bere";
}

const CATEGORIES: Category[] = [
  { id: "1", name: "Antipasti", slug: "antipasti", section: "mangiare" },
  { id: "2", name: "Primi", slug: "primi", section: "mangiare" },
  { id: "3", name: "Secondi", slug: "secondi", section: "mangiare" },
  { id: "4", name: "Dolci", slug: "dolci", section: "mangiare" },
  { id: "5", name: "Vini", slug: "vini", section: "bere" },
  { id: "6", name: "Cocktail", slug: "cocktail", section: "bere" },
  { id: "7", name: "Birre", slug: "birre", section: "bere" },
];

/* Promo items */
interface DemoPromo {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  promoPrice: number;
  badge: string;
  image: string;
}

const DEMO_PROMOS: DemoPromo[] = [
  {
    id: "promo1",
    title: "Aperitivo per due",
    description: "2 Spritz + Tagliere misto",
    originalPrice: 36,
    promoPrice: 25,
    badge: "Offerta",
    image: "/images/promo-aperitivo.jpg",
  },
  {
    id: "promo2",
    title: "Menu degustazione",
    description: "Antipasto + Primo + Dolce",
    originalPrice: 42,
    promoPrice: 32,
    badge: "Speciale",
    image: "/images/promo-degustazione.jpg",
  },
  {
    id: "promo3",
    title: "Happy Hour",
    description: "Cocktail + stuzzichini dalle 18-20",
    originalPrice: 18,
    promoPrice: 12,
    badge: "-33%",
    image: "/images/promo-happy-hour.jpg",
  },
];

const ITEMS_BY_CATEGORY: Record<
  string,
  { group?: string; items: MenuItem[] }[]
> = {
  antipasti: [
    {
      group: "antipasti",
      items: [
        {
          id: "a1",
          name: "Burrata pugliese",
          description: "Datterini, basilico, olio EVO",
          price: 14,
          category: "antipasti",
          allergens: ["Milk"],
          features: ["Vegetarian"],
          image: "/images/burrata.jpg",
        },
        {
          id: "a2",
          name: "Tartare di tonno",
          description: "Avocado, sesamo, salsa di soia",
          price: 16,
          category: "antipasti",
          allergens: ["Fish", "Sesame", "Soy"],
          image: "/images/tuna-tartare.jpg",
        },
        {
          id: "a3",
          name: "Carpaccio di polpo",
          description: "Patate tiepide, olive taggiasche",
          price: 13,
          category: "antipasti",
          allergens: ["Molluscs"],
          image: "/images/octopus.jpg",
        },
        {
          id: "a4",
          name: "Vitello tonnato",
          description: "Salsa tonnata della tradizione",
          price: 12,
          category: "antipasti",
          allergens: ["Fish", "Eggs"],
        },
        {
          id: "a5",
          name: "Tagliere misto",
          description: "Salumi e formaggi della casa",
          price: 18,
          category: "antipasti",
          allergens: ["Milk", "Gluten"],
        },
      ],
    },
  ],
  primi: [
    {
      group: "primi",
      items: [
        {
          id: "p1",
          name: "Cacio e pepe",
          description: "Pecorino romano DOP, pepe nero",
          price: 14,
          category: "primi",
          allergens: ["Gluten", "Milk"],
        },
        {
          id: "p2",
          name: "Amatriciana",
          description: "Guanciale, pomodoro San Marzano",
          price: 13,
          category: "primi",
          allergens: ["Gluten"],
        },
        {
          id: "p3",
          name: "Risotto ai funghi",
          description: "Porcini, prezzemolo, parmigiano",
          price: 16,
          category: "primi",
          allergens: ["Milk"],
          features: ["Gluten-free"],
        },
        {
          id: "p4",
          name: "Paccheri alla Norma",
          description: "Melanzane, ricotta salata, basilico",
          price: 14,
          category: "primi",
          allergens: ["Gluten", "Milk"],
          features: ["Vegetarian"],
        },
      ],
    },
  ],
  secondi: [
    {
      group: "secondi",
      items: [
        {
          id: "s1",
          name: "Tagliata di manzo",
          description: "Rucola, pomodorini, scaglie di grana",
          price: 22,
          category: "secondi",
          allergens: ["Milk"],
        },
        {
          id: "s2",
          name: "Branzino al forno",
          description: "Patate, olive, capperi",
          price: 20,
          category: "secondi",
          allergens: ["Fish"],
        },
        {
          id: "s3",
          name: "Pollo alla griglia",
          description: "Verdure di stagione",
          price: 16,
          category: "secondi",
          features: ["Gluten-free"],
        },
      ],
    },
  ],
  dolci: [
    {
      group: "dolci",
      items: [
        {
          id: "d1",
          name: "Tiramisù",
          description: "Mascarpone, savoiardi, caffè",
          price: 8,
          category: "dolci",
          allergens: ["Gluten", "Eggs", "Milk"],
        },
        {
          id: "d2",
          name: "Panna cotta",
          description: "Frutti di bosco",
          price: 7,
          category: "dolci",
          allergens: ["Milk"],
          features: ["Gluten-free"],
        },
      ],
    },
  ],
  vini: [
    {
      group: "vini rossi",
      items: [
        {
          id: "v1",
          name: "Chianti Classico",
          description: "Toscana DOCG, 2021",
          price: 8,
          category: "vini",
          allergens: ["Sulphites"],
        },
        {
          id: "v2",
          name: "Barolo",
          description: "Piemonte DOCG, 2019",
          price: 14,
          category: "vini",
          allergens: ["Sulphites"],
        },
        {
          id: "v3",
          name: "Montepulciano",
          description: "d'Abruzzo DOC, 2022",
          price: 7,
          category: "vini",
          allergens: ["Sulphites"],
        },
      ],
    },
    {
      group: "vini bianchi",
      items: [
        {
          id: "v4",
          name: "Prosecco Valdobbiadene",
          description: "Extra Dry, Veneto",
          price: 7,
          category: "vini",
          allergens: ["Sulphites"],
        },
        {
          id: "v5",
          name: "Vermentino",
          description: "Sardegna DOC, 2023",
          price: 8,
          category: "vini",
          allergens: ["Sulphites"],
        },
      ],
    },
  ],
  cocktail: [
    {
      group: "cocktail",
      items: [
        {
          id: "c1",
          name: "Aperol Spritz",
          description: "Aperol, prosecco, seltz",
          price: 9,
          category: "cocktail",
        },
        {
          id: "c2",
          name: "Negroni",
          description: "Gin, Campari, vermouth rosso",
          price: 10,
          category: "cocktail",
        },
        {
          id: "c3",
          name: "Hugo",
          description: "Prosecco, sciroppo di sambuco, menta",
          price: 9,
          category: "cocktail",
        },
      ],
    },
  ],
  birre: [
    {
      group: "birre",
      items: [
        {
          id: "b1",
          name: "Peroni Nastro Azzurro",
          description: "Lager italiana, 33cl",
          price: 5,
          category: "birre",
        },
        {
          id: "b2",
          name: "IPA Artigianale",
          description: "Birrificio locale, 33cl",
          price: 7,
          category: "birre",
        },
      ],
    },
  ],
};

/* ─── Allergen icons (same as real AllergenBadges) ─── */

// biome-ignore lint/suspicious/noExplicitAny: hugeicons IconSvgObject type is not exported — using any keeps the registry simple.
const ALLERGEN_ICON_MAP: Record<string, any> = {
  Gluten: WheatIcon,
  Crustaceans: CrabIcon,
  Eggs: EggIcon,
  Fish: FishFoodIcon,
  Peanuts: NutIcon,
  Soy: BeanIcon,
  Milk: MilkBottleIcon,
  TreeNuts: CoffeeBeansIcon,
  Celery: LeafyGreenIcon,
  Mustard: FlowerIcon,
  Sesame: CornIcon,
  Sulphites: GrapesIcon,
  Lupins: Plant03Icon,
  Molluscs: ShellfishIcon,
};

// biome-ignore lint/suspicious/noExplicitAny: hugeicons IconSvgObject type is not exported — using any keeps the registry simple.
const FEATURE_ICON_MAP: Record<string, any> = {
  Vegetarian: VegetarianFoodIcon,
  Vegan: Leaf01Icon,
  "Gluten-free": WheatOffIcon,
  Spicy: FireIcon,
  "Lactose-free": MilkOatIcon,
  Organic: OrganicFoodIcon,
  New: SparklesIcon,
};

/* ─── Static allergen badges (mirrors AllergenBadges with real HugeIcons) ─── */

function StaticAllergenBadges({
  allergens = [],
  features = [],
}: {
  allergens?: string[];
  features?: string[];
}) {
  if (!(allergens.length || features.length)) {
    return null;
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {allergens.map((a) => {
        const iconDef = ALLERGEN_ICON_MAP[a];
        return (
          <span
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full leading-none"
            key={a}
            style={{
              backgroundColor: "var(--menu-allergen, #B1693A)",
              color: "var(--menu-allergen-icon, #FFFFFF)",
            }}
            title={a}
          >
            {iconDef ? (
              <HugeiconsIcon className="h-3.5 w-3.5" icon={iconDef} />
            ) : (
              a.slice(0, 2)
            )}
          </span>
        );
      })}
      {features.map((f) => {
        const iconDef = FEATURE_ICON_MAP[f];
        return (
          <span
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center"
            key={f}
            style={{ color: "var(--menu-text)", opacity: 0.4 }}
            title={f}
          >
            {iconDef ? (
              <HugeiconsIcon className="h-4.5 w-4.5" icon={iconDef} />
            ) : (
              f.slice(0, 3)
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Static menu item (mirrors CompactMenuItem exactly) ─── */

function StaticMenuItem({ item }: { item: MenuItem }) {
  return (
    <div className="-mx-2 px-2">
      <div className={item.image ? "flex items-start gap-3 pt-5" : undefined}>
        {item.image ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-black/5">
            <Image
              alt={item.imageAlt ?? item.name}
              className="object-cover"
              fill
              sizes="56px"
              src={item.image}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div
            className={`flex items-baseline pb-0 ${item.image ? "" : "pt-5"}`}
          >
            <span
              className="min-w-0 font-display font-semibold text-base uppercase"
              style={{ color: "var(--menu-text)" }}
            >
              {item.name}
            </span>
            <span className="dotted-leader" />
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className="whitespace-nowrap font-display font-semibold text-base"
                style={{ color: "var(--menu-price, var(--menu-primary))" }}
              >
                {item.price?.toFixed(2)}
              </span>
              <span className="inline-block w-4" />
            </div>
          </div>
          {item.description && (
            <p
              className="pb-0 font-sans text-sm leading-relaxed"
              style={{ color: "var(--menu-text)", opacity: 0.6 }}
            >
              {item.description}
            </p>
          )}
          <StaticAllergenBadges
            allergens={item.allergens}
            features={item.features}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Static promo card (mirrors PromotionCard exactly) ─── */

function StaticPromoCard({ promo }: { promo: DemoPromo }) {
  return (
    <div
      className="relative flex h-full flex-col rounded-lg border p-4"
      style={{
        backgroundColor: "var(--menu-card-bg, var(--menu-primary-light))",
        borderColor: "var(--menu-border, var(--menu-accent))",
      }}
    >
      {/* Badge — top right */}
      {promo.badge && (
        <div className="absolute top-3 right-3 z-10">
          <Badge
            className="font-bold font-sans text-white text-xs shadow-lg"
            style={{ backgroundColor: "var(--menu-primary)" }}
          >
            {promo.badge}
          </Badge>
        </div>
      )}

      {/* Image — 4:3 aspect */}
      <div className="mb-3 w-full">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, var(--menu-primary), color-mix(in srgb, var(--menu-primary) 70%, white))",
          }}
        >
          <Image
            alt={promo.title}
            className="object-cover"
            fill
            sizes="350px"
            src={promo.image}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <h3
          className="mb-2 font-bold font-display text-lg uppercase"
          style={{ color: "var(--menu-text)" }}
        >
          {promo.title}
        </h3>

        <p
          className="mb-3 flex-1 font-sans text-sm"
          style={{ color: "var(--menu-text)", opacity: 0.7 }}
        >
          {promo.description}
        </p>

        {/* Pricing */}
        <div className="flex flex-col">
          {promo.originalPrice && (
            <span
              className="font-sans text-sm line-through"
              style={{ color: "var(--menu-text)", opacity: 0.5 }}
            >
              &euro; {promo.originalPrice.toFixed(2)}
            </span>
          )}
          <span
            className="font-bold font-display text-2xl"
            style={{ color: "var(--menu-price, var(--menu-primary))" }}
          >
            &euro; {promo.promoPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Static menu list (mirrors CompactMenuList exactly) ─── */

function StaticMenuList({
  groups,
}: {
  groups: { group?: string; items: MenuItem[] }[];
}) {
  return (
    <div className="space-y-2">
      {groups.map((g, groupIndex) => (
        <div key={g.group ?? `ungrouped-${groupIndex}`}>
          {g.group && (
            <div
              className={`mb-1 flex items-center gap-4 ${groupIndex === 0 ? "pt-5" : "pt-10"}`}
            >
              <span
                className="font-bold font-display text-2xl lowercase tracking-tight"
                style={{ color: "var(--menu-text)" }}
              >
                {g.group}
                <span style={{ color: "var(--menu-primary)" }}>.</span>
              </span>
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: "var(--menu-border, var(--menu-accent))",
                }}
              />
            </div>
          )}
          <div>
            {g.items.map((item) => (
              <StaticMenuItem item={item} key={item.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main export: interactive static menu at full mobile size ─── */

export function StaticMenuDemo({ height }: { height?: number }) {
  const [activeSection, setActiveSection] = useState<Section>("mangiare");
  const [activeCategory, setActiveCategory] = useState("antipasti");

  const themeCSS = themeToCSS(DEMO_THEME);
  const currentCategories = CATEGORIES.filter(
    (c) => c.section === (activeSection === "mangiare" ? "mangiare" : "bere")
  );
  const currentGroups = ITEMS_BY_CATEGORY[activeCategory] ?? [];

  const sections: { key: Section; label: string }[] = [
    { key: "promos", label: "Promos" },
    { key: "mangiare", label: "Mangiare" },
    { key: "bere", label: "Bere" },
  ];

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    if (section === "mangiare") {
      const firstCat = CATEGORIES.find((c) => c.section === "mangiare");
      if (firstCat) {
        setActiveCategory(firstCat.slug);
      }
    } else if (section === "bere") {
      const firstCat = CATEGORIES.find((c) => c.section === "bere");
      if (firstCat) {
        setActiveCategory(firstCat.slug);
      }
    }
  };

  return (
    <MenuThemeProvider value={DEMO_THEME}>
      <div
        className="flex flex-col"
        data-menu-demo
        style={{
          ...themeCSS,
          backgroundColor: "#ffffff",
          width: 390,
          height: height ?? 680,
        }}
      >
        <style>{`
          [data-menu-demo] .font-display { font-family: ${getFontFamily(DEMO_THEME.fontDisplay)} !important; }
          [data-menu-demo] .font-sans { font-family: ${getFontFamily(DEMO_THEME.fontBody)} !important; }
        `}</style>

        {/* ── Fixed header + tabs (sticky top) ── */}
        <div className="shrink-0" style={{ backgroundColor: "#ffffff" }}>
          {/* Header (mirrors MenuHeader) */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Image
                alt="Logo"
                className="object-contain"
                height={32}
                src="/images/default-logo.svg"
                style={{ height: 32, width: "auto" }}
                width={80}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button className="h-6 w-6 p-0" size="icon" variant="ghost">
                <Search
                  className="size-6"
                  style={{ color: "var(--menu-text)" }}
                />
              </Button>
              <Button
                className="h-8 w-8 p-0 text-xl leading-none"
                size="icon"
                variant="ghost"
              >
                🇮🇹
              </Button>
            </div>
          </div>

          {/* Section tabs (mirrors DigitalMenu — with Promos) */}
          <div
            className="border-b"
            style={{ borderColor: "var(--menu-border, var(--menu-accent))" }}
          >
            <div className="flex items-center px-4 pt-4">
              {sections.map((section) => {
                const isActive = activeSection === section.key;
                const isPromo = section.key === "promos";
                return (
                  <button
                    className="flex-1 cursor-pointer pb-2 font-bold text-xl tracking-tight transition-colors"
                    key={section.key}
                    onClick={() => handleSectionChange(section.key)}
                    style={{
                      fontFamily: "var(--menu-font-display)",
                      color:
                        isActive && isPromo ? undefined : "var(--menu-text)",
                      opacity: isActive ? 1 : 0.4,
                    }}
                    type="button"
                  >
                    <span
                      className="relative inline-block"
                      style={
                        isActive && isPromo
                          ? {
                              backgroundImage: "var(--menu-promo-gradient)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }
                          : undefined
                      }
                    >
                      {section.label}
                      {isActive && (
                        <div
                          className="absolute right-0 -bottom-2 left-0 h-0.5 rounded-full"
                          style={
                            isPromo
                              ? {
                                  backgroundImage: "var(--menu-promo-gradient)",
                                }
                              : { backgroundColor: "var(--menu-primary)" }
                          }
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-category pills (only for mangiare/bere) */}
            {activeSection !== "promos" && (
              <div
                className="scrollbar-hide overflow-x-auto border-t py-2"
                style={{
                  borderColor: "var(--menu-border, var(--menu-accent))",
                }}
              >
                <div className="flex w-max min-w-full gap-2 px-4">
                  {currentCategories.map((category) => {
                    const isActive = activeCategory === category.slug;
                    return (
                      <button
                        className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-sm px-4 py-2 font-medium text-base transition-colors"
                        key={category.id}
                        onClick={() => setActiveCategory(category.slug)}
                        style={{
                          fontFamily: "var(--menu-font-display)",
                          backgroundColor: isActive
                            ? "var(--menu-primary)"
                            : "var(--menu-tab-bg, var(--menu-accent))",
                          color: isActive
                            ? "var(--menu-tab-active-text, #fff)"
                            : "var(--menu-tab-text, var(--menu-text))",
                          opacity: isActive ? 1 : 0.6,
                        }}
                        type="button"
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 pb-8">
            {activeSection === "promos" ? (
              <div className="space-y-4 pt-5">
                {DEMO_PROMOS.map((promo) => (
                  <StaticPromoCard key={promo.id} promo={promo} />
                ))}
              </div>
            ) : (
              <StaticMenuList groups={currentGroups} />
            )}
          </div>
        </div>
      </div>
    </MenuThemeProvider>
  );
}
