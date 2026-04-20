export type CategorySection = "food" | "drink";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  category: string;
  priceLabel?: string;
  group?: string;
  allergens?: string[];
  features?: string[];
  additives?: string[];
  /** Public URL for dish photo */
  image?: string;
  imageAlt?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  originalPrice?: number;
  promoPrice: number;
  validUntil?: string;
  image: string;
  badge?: string;
  items?: string[];
  longDescription?: string;
}

export interface MenuGroup {
  id: string;
  name: string;
  slug: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  section: CategorySection;
  groups?: MenuGroup[];
  items: MenuItem[];
}

export interface PromotionCategory {
  id: string;
  name: string;
  slug: string;
  promotions: Promotion[];
}
