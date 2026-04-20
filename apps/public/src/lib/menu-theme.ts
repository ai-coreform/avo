"use client";

import { createContext, useContext } from "react";

export interface MenuTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headerBg: string;
  priceColor: string;
  cardBg: string;
  borderColor: string;
  tabBg: string;
  tabText: string;
  tabActiveText: string;
  promoGradient: string;
  allergenColor: string;
  allergenIconColor: string;
  /** Logo height in pixels, clamped between LOGO_SIZE_MIN and LOGO_SIZE_MAX */
  logoSize: number;
  fontDisplay: string;
  fontBody: string;
  logoUrl: string | null;
}

export const LOGO_SIZE_MIN = 20;
export const LOGO_SIZE_MAX = 48;
export const LOGO_SIZE_STEP = 4;
export const LOGO_SIZE_DEFAULT = 32;

export const defaultMenuTheme: MenuTheme = {
  primaryColor: "#1A1A1A",
  backgroundColor: "#FFFFFF",
  textColor: "#1A1A1A",
  accentColor: "#F0F0F0",
  headerBg: "#FFFFFF",
  priceColor: "#1A1A1A",
  cardBg: "#FAFAFA",
  borderColor: "#F0F0F0",
  tabBg: "#F0F0F0",
  tabText: "#1A1A1A",
  tabActiveText: "#FFFFFF",
  promoGradient: "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)",
  allergenColor: "#B1693A",
  allergenIconColor: "#FFFFFF",
  logoSize: LOGO_SIZE_DEFAULT,
  fontDisplay: "bricolage-grotesque",
  fontBody: "dm-sans",
  logoUrl: null,
};

export interface ThemePreset {
  name: string;
  description: string;
  colors: Omit<MenuTheme, "logoSize" | "fontDisplay" | "fontBody" | "logoUrl">;
}

export const PROMO_GRADIENT_PRESETS = [
  {
    name: "Aurora",
    value: "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)",
  },
  {
    name: "Tramonto",
    value: "linear-gradient(to right, #F97316, #EF4444, #EC4899)",
  },
  {
    name: "Bosco",
    value: "linear-gradient(to right, #22C55E, #14B8A6, #0EA5E9)",
  },
  {
    name: "Oro",
    value: "linear-gradient(to right, #F59E0B, #D97706, #B45309)",
  },
  {
    name: "Notte",
    value: "linear-gradient(to right, #6366F1, #8B5CF6, #A855F7)",
  },
  {
    name: "Fuoco",
    value: "linear-gradient(to right, #EF4444, #F97316, #FBBF24)",
  },
] as const;

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Avo",
    description: "Il nostro verde iconico",
    colors: {
      primaryColor: "#29402A",
      backgroundColor: "#FAFDF5",
      textColor: "#29402A",
      accentColor: "#E2F88F",
      headerBg: "#FAFDF5",
      priceColor: "#29402A",
      cardBg: "#F0F7E0",
      borderColor: "#D4E8B0",
      tabBg: "#E2F0C8",
      tabText: "#29402A",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #22C55E, #14B8A6, #0EA5E9)",
      allergenColor: "#29402A",
      allergenIconColor: "#FFFFFF",
    },
  },
  {
    name: "Classico",
    description: "Bianco e nero elegante",
    colors: {
      primaryColor: "#1A1A1A",
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A1A",
      accentColor: "#F0F0F0",
      headerBg: "#FFFFFF",
      priceColor: "#1A1A1A",
      cardBg: "#FAFAFA",
      borderColor: "#E5E5E5",
      tabBg: "#F0F0F0",
      tabText: "#1A1A1A",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)",
      allergenColor: "#B1693A",
      allergenIconColor: "#FFFFFF",
    },
  },
  {
    name: "Trattoria",
    description: "Rosso caldo e avorio",
    colors: {
      primaryColor: "#B91C1C",
      backgroundColor: "#FFF8F0",
      textColor: "#3D2B1F",
      accentColor: "#F5E6D3",
      headerBg: "#FFF8F0",
      priceColor: "#B91C1C",
      cardBg: "#FFF1E6",
      borderColor: "#EEDCC8",
      tabBg: "#F5E6D3",
      tabText: "#3D2B1F",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #EF4444, #F97316, #FBBF24)",
      allergenColor: "#C27A4A",
      allergenIconColor: "#FFFFFF",
    },
  },
  {
    name: "Osteria",
    description: "Verde bosco naturale",
    colors: {
      primaryColor: "#2D5016",
      backgroundColor: "#FEFDF5",
      textColor: "#2C2C2C",
      accentColor: "#E8EDDE",
      headerBg: "#FEFDF5",
      priceColor: "#2D5016",
      cardBg: "#F5F7EE",
      borderColor: "#D8DFC8",
      tabBg: "#E8EDDE",
      tabText: "#2C2C2C",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #22C55E, #14B8A6, #0EA5E9)",
      allergenColor: "#5C7A2E",
      allergenIconColor: "#FFFFFF",
    },
  },
  {
    name: "Notte",
    description: "Scuro con accenti dorati",
    colors: {
      primaryColor: "#D4A853",
      backgroundColor: "#1A1A2E",
      textColor: "#E8E8E8",
      accentColor: "#2A2A42",
      headerBg: "#16162A",
      priceColor: "#D4A853",
      cardBg: "#222238",
      borderColor: "#2A2A42",
      tabBg: "#2A2A42",
      tabText: "#C0C0D0",
      tabActiveText: "#1A1A2E",
      promoGradient: "linear-gradient(to right, #F59E0B, #D97706, #B45309)",
      allergenColor: "#D4A853",
      allergenIconColor: "#1A1A2E",
    },
  },
  {
    name: "Marino",
    description: "Blu oceano e sabbia",
    colors: {
      primaryColor: "#1E40AF",
      backgroundColor: "#FFFBF5",
      textColor: "#1E293B",
      accentColor: "#E0E7F1",
      headerBg: "#FFFBF5",
      priceColor: "#1E40AF",
      cardBg: "#F0F4FA",
      borderColor: "#C8D5E8",
      tabBg: "#E0E7F1",
      tabText: "#1E293B",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)",
      allergenColor: "#2563EB",
      allergenIconColor: "#FFFFFF",
    },
  },
  {
    name: "Moderno",
    description: "Minimal con tocco viola",
    colors: {
      primaryColor: "#7C3AED",
      backgroundColor: "#FFFFFF",
      textColor: "#18181B",
      accentColor: "#F3F0FF",
      headerBg: "#FFFFFF",
      priceColor: "#7C3AED",
      cardBg: "#FAFAFF",
      borderColor: "#E8E0FF",
      tabBg: "#F3F0FF",
      tabText: "#18181B",
      tabActiveText: "#FFFFFF",
      promoGradient: "linear-gradient(to right, #6366F1, #8B5CF6, #A855F7)",
      allergenColor: "#7C3AED",
      allergenIconColor: "#FFFFFF",
    },
  },
];

export const FONT_OPTIONS = [
  {
    value: "bricolage-grotesque",
    label: "Bricolage Grotesque",
    url: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap",
  },
  {
    value: "playfair-display",
    label: "Playfair Display",
    url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap",
  },
  {
    value: "lora",
    label: "Lora",
    url: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  },
  {
    value: "inter",
    label: "Inter",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
  {
    value: "poppins",
    label: "Poppins",
    url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
  },
  {
    value: "raleway",
    label: "Raleway",
    url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&display=swap",
  },
  {
    value: "merriweather",
    label: "Merriweather",
    url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  },
] as const;

export function getFontFamily(fontValue: string): string {
  const map: Record<string, string> = {
    "bricolage-grotesque": '"Bricolage Grotesque", sans-serif',
    "playfair-display": '"Playfair Display", serif',
    lora: '"Lora", serif',
    inter: '"Inter", sans-serif',
    poppins: '"Poppins", sans-serif',
    raleway: '"Raleway", sans-serif',
    merriweather: '"Merriweather", serif',
    "dm-sans": '"DM Sans", sans-serif',
  };
  return map[fontValue] ?? map["bricolage-grotesque"];
}

const MenuThemeContext = createContext<MenuTheme>(defaultMenuTheme);

export const MenuThemeProvider = MenuThemeContext.Provider;
export const useMenuTheme = () => useContext(MenuThemeContext);

/** Derive CSS custom properties from a MenuTheme */
export function themeToCSS(theme: MenuTheme): React.CSSProperties {
  // Compute a lighter variant of the primary color for highlights
  const primaryLight = `${theme.primaryColor}1A`; // ~10% opacity hex

  return {
    "--menu-primary": theme.primaryColor,
    "--menu-primary-light": primaryLight,
    "--menu-bg": theme.backgroundColor,
    "--menu-text": theme.textColor,
    "--menu-accent": theme.accentColor,
    "--menu-header-bg": theme.headerBg ?? theme.backgroundColor,
    "--menu-price": theme.priceColor ?? theme.primaryColor,
    "--menu-card-bg": theme.cardBg ?? theme.backgroundColor,
    "--menu-border": theme.borderColor ?? theme.accentColor,
    "--menu-tab-bg": theme.tabBg ?? theme.accentColor,
    "--menu-tab-text": theme.tabText ?? theme.textColor,
    "--menu-tab-active-text": theme.tabActiveText ?? "#FFFFFF",
    "--menu-promo-gradient":
      theme.promoGradient ??
      "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)",
    "--menu-allergen": theme.allergenColor ?? "#B1693A",
    "--menu-allergen-icon": theme.allergenIconColor ?? "#FFFFFF",
    "--menu-font-display": getFontFamily(theme.fontDisplay),
    "--menu-font-body": getFontFamily(theme.fontBody),
    // Override Tailwind's font-family CSS vars so font-display / font-sans
    // classes within the menu resolve to the theme's chosen fonts
    "--font-display": getFontFamily(theme.fontDisplay),
    "--font-sans": getFontFamily(theme.fontBody),
  } as React.CSSProperties;
}
