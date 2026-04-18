// ── Allergens (14 official Italian allergens per Reg. EU 1169/2011) ──

export interface AllergenDef {
  id: string;
  number: number;
  label: string;
  color: string;
  icon: string; // icon key in ALLERGEN_ICONS map
}

export const ALLERGENS: AllergenDef[] = [
  {
    id: "gluten",
    number: 1,
    label: "Glutine",
    color: "#D97706",
    icon: "Gluten",
  },
  {
    id: "crustaceans",
    number: 2,
    label: "Crostacei",
    color: "#DC2626",
    icon: "Crustaceans",
  },
  { id: "egg", number: 3, label: "Uova", color: "#F59E0B", icon: "Eggs" },
  { id: "fish", number: 4, label: "Pesce", color: "#2563EB", icon: "Fish" },
  {
    id: "peanut",
    number: 5,
    label: "Arachidi",
    color: "#92400E",
    icon: "Peanuts",
  },
  { id: "soy", number: 6, label: "Soia", color: "#65A30D", icon: "Soy" },
  {
    id: "milk",
    number: 7,
    label: "Latte e derivati",
    color: "#0891B2",
    icon: "Milk",
  },
  {
    id: "nuts",
    number: 8,
    label: "Frutta a guscio",
    color: "#A16207",
    icon: "TreeNuts",
  },
  {
    id: "celery",
    number: 9,
    label: "Sedano",
    color: "#16A34A",
    icon: "Celery",
  },
  {
    id: "mustard",
    number: 10,
    label: "Senape",
    color: "#CA8A04",
    icon: "Mustard",
  },
  {
    id: "sesame",
    number: 11,
    label: "Sesamo",
    color: "#EA580C",
    icon: "Sesame",
  },
  {
    id: "sulfites",
    number: 12,
    label: "Solfiti",
    color: "#7C3AED",
    icon: "Sulphites",
  },
  {
    id: "lupins",
    number: 13,
    label: "Lupini",
    color: "#059669",
    icon: "Lupins",
  },
  {
    id: "shellfish",
    number: 14,
    label: "Molluschi",
    color: "#0D9488",
    icon: "Molluscs",
  },
];

// ── Features / Characteristics ──────────────────────────

export interface FeatureDef {
  id: string;
  label: string;
  icon: string; // lucide-react icon name
}

export const FEATURES: FeatureDef[] = [
  { id: "frozen", label: "Surgelato", icon: "Snowflake" },
  { id: "gluten_free", label: "Senza glutine", icon: "WheatOff" },
  { id: "blast_chilled", label: "Abbattuto", icon: "ThermometerSnowflake" },
  { id: "spicy", label: "Piccante", icon: "Flame" },
  { id: "vegetarian", label: "Vegetariano", icon: "Leaf" },
  { id: "vegan", label: "Vegano", icon: "Sprout" },
  { id: "lactose_free", label: "Senza lattosio", icon: "MilkOff" },
  { id: "organic", label: "Biologico", icon: "TreeDeciduous" },
  { id: "halal", label: "Halal", icon: "Star" },
  { id: "new", label: "Nuovo", icon: "Sparkles" },
  { id: "recommended", label: "Consigliato", icon: "ThumbsUp" },
];

// ── Additives ───────────────────────────────────────────

export interface AdditiveDef {
  id: string;
  label: string;
}

export const ADDITIVES: AdditiveDef[] = [
  { id: "colorants", label: "Coloranti" },
  { id: "preservatives", label: "Conservanti" },
  { id: "antioxidants", label: "Antiossidanti" },
  { id: "flavor_enhancers", label: "Esaltatori di sapidità" },
  { id: "sulfide", label: "Solfato" },
  { id: "smoked", label: "Affumicato" },
  { id: "waxed", label: "Cibo cerato" },
  { id: "sweetener", label: "Dolcificante" },
  { id: "aspartame", label: "Aspartame" },
  { id: "phenylalanine", label: "Fonte di fenilalanina" },
  { id: "phosphate", label: "Fosfati" },
  { id: "caffeine", label: "Caffeina" },
  { id: "quinine", label: "Chinino" },
];

// ── Lookup maps ─────────────────────────────────────────

export const ALLERGEN_MAP = Object.fromEntries(
  ALLERGENS.map((a) => [a.id, a])
) as Record<string, AllergenDef>;
export const FEATURE_MAP = Object.fromEntries(
  FEATURES.map((f) => [f.id, f])
) as Record<string, FeatureDef>;
export const ADDITIVE_MAP = Object.fromEntries(
  ADDITIVES.map((a) => [a.id, a])
) as Record<string, AdditiveDef>;
