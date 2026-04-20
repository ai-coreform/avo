export interface AllergenDef {
  id: string;
  number: number;
  label: string;
  color: string;
}

export interface FeatureDef {
  id: string;
  label: string;
}

export interface AdditiveDef {
  id: string;
  label: string;
}

export const ALLERGENS: AllergenDef[] = [
  { id: "gluten", number: 1, label: "Glutine", color: "#D97706" },
  { id: "crustaceans", number: 2, label: "Crostacei", color: "#DC2626" },
  { id: "egg", number: 3, label: "Uova", color: "#F59E0B" },
  { id: "fish", number: 4, label: "Pesce", color: "#2563EB" },
  { id: "peanut", number: 5, label: "Arachidi", color: "#92400E" },
  { id: "soy", number: 6, label: "Soia", color: "#65A30D" },
  { id: "milk", number: 7, label: "Latte e derivati", color: "#0891B2" },
  { id: "nuts", number: 8, label: "Frutta a guscio", color: "#A16207" },
  { id: "celery", number: 9, label: "Sedano", color: "#16A34A" },
  { id: "mustard", number: 10, label: "Senape", color: "#CA8A04" },
  { id: "sesame", number: 11, label: "Sesamo", color: "#EA580C" },
  { id: "sulfites", number: 12, label: "Solfiti", color: "#7C3AED" },
  { id: "lupins", number: 13, label: "Lupini", color: "#059669" },
  { id: "shellfish", number: 14, label: "Molluschi", color: "#0D9488" },
];

export const FEATURES: FeatureDef[] = [
  { id: "frozen", label: "Surgelato" },
  { id: "gluten_free", label: "Senza glutine" },
  { id: "blast_chilled", label: "Abbattuto" },
  { id: "spicy", label: "Piccante" },
  { id: "vegetarian", label: "Vegetariano" },
  { id: "vegan", label: "Vegano" },
  { id: "lactose_free", label: "Senza lattosio" },
  { id: "organic", label: "Biologico" },
  { id: "halal", label: "Halal" },
  { id: "new", label: "Nuovo" },
  { id: "recommended", label: "Consigliato" },
];

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

export const ALLERGEN_MAP = Object.fromEntries(
  ALLERGENS.map((a) => [a.id, a])
) as Record<string, AllergenDef>;

export const FEATURE_MAP = Object.fromEntries(
  FEATURES.map((f) => [f.id, f])
) as Record<string, FeatureDef>;

export const ADDITIVE_MAP = Object.fromEntries(
  ADDITIVES.map((a) => [a.id, a])
) as Record<string, AdditiveDef>;
