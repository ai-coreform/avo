import type { MenuTheme } from "@avo/menu/menu-theme";

export interface PublicMenuLocale {
  locale: string;
  isEnabled: boolean;
}

export interface PublicVenueAiSettings {
  bgColor?: string;
  questions?: string[];
}

export interface PublicMenuVenue {
  name: string;
  slug: string;
  logo: string | null;
  defaultLocale: string;
  locales: PublicMenuLocale[];
  aiSettings: PublicVenueAiSettings;
}

export interface PublicMenuEntry {
  id: string;
  kind: "entry" | "group";
  title: string;
  description: string | null;
  price: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  allergens: string[];
  features: string[];
  additives: string[];
}

export interface PublicMenuCategory {
  id: string;
  title: string;
  slug: string;
  entries: PublicMenuEntry[];
}

export interface PublicMenuTab {
  id: string;
  label: string;
  slug: string;
  categories: PublicMenuCategory[];
}

export interface PublicMenuPromotionComponent {
  displayName: string | null;
  quantity: number;
}

export interface PublicMenuPromotionSchedule {
  weekday: string | null;
  startTime: string | null;
  endTime: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
}

export interface PublicMenuPromotion {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  promoPrice: number;
  originalPrice: number | null;
  imageUrl: string | null;
  badgeLabel: string | null;
  components: PublicMenuPromotionComponent[];
  schedules: PublicMenuPromotionSchedule[];
}

export interface PublicMenuMenu {
  id: string;
  name: string;
  slug: string;
  theme: Partial<MenuTheme>;
  tabs: PublicMenuTab[];
  promotions: PublicMenuPromotion[];
}

export interface PublicMenuData {
  venue: PublicMenuVenue;
  menu: PublicMenuMenu;
}

export interface GetPublicMenuResponse {
  data: PublicMenuData;
}

export interface TranslationsData {
  translations: Record<string, Record<string, string | null>>;
}

export interface GetTranslationsResponse {
  data: TranslationsData;
}
