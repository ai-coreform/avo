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
  logoSize: number;
  fontDisplay: string;
  fontBody: string;
}

export const LOGO_SIZE_MIN = 12;
export const LOGO_SIZE_MAX = 64;
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
};

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
  const defaultFontFamily = '"Bricolage Grotesque", sans-serif';
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
  return map[fontValue] ?? defaultFontFamily;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function mixColors(hex1: string, hex2: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount
  );
}

export function deriveFullThemeColors(
  primary: string,
  bg?: string,
  accent?: string
): Omit<MenuTheme, "logoSize" | "fontDisplay" | "fontBody"> {
  const backgroundColor = bg ?? "#FFFFFF";
  const bgIsDark = luminance(backgroundColor) < 0.5;
  const primaryIsDark = luminance(primary) < 0.5;

  const textColor = bgIsDark ? "#E8E8E8" : "#1A1A1A";
  const accentColor = accent ?? mixColors(primary, backgroundColor, 0.85);

  return {
    primaryColor: primary,
    backgroundColor,
    textColor,
    accentColor,
    headerBg: backgroundColor,
    priceColor: primary,
    cardBg: bgIsDark
      ? mixColors(backgroundColor, "#FFFFFF", 0.04)
      : mixColors(backgroundColor, "#000000", 0.02),
    borderColor: bgIsDark
      ? mixColors(backgroundColor, "#FFFFFF", 0.08)
      : mixColors(backgroundColor, "#000000", 0.06),
    tabBg: accentColor,
    tabText: textColor,
    tabActiveText: primaryIsDark ? "#FFFFFF" : "#1A1A1A",
    promoGradient: defaultMenuTheme.promoGradient,
    allergenColor: primary,
    allergenIconColor: primaryIsDark ? "#FFFFFF" : "#1A1A1A",
  };
}

export function resolveTheme(
  partial: Partial<MenuTheme> | undefined
): MenuTheme {
  if (!partial || Object.keys(partial).length === 0) {
    return defaultMenuTheme;
  }

  if (partial.primaryColor && !partial.textColor) {
    const derived = deriveFullThemeColors(
      partial.primaryColor,
      partial.backgroundColor,
      partial.accentColor
    );
    return {
      ...defaultMenuTheme,
      ...derived,
      logoSize: partial.logoSize ?? defaultMenuTheme.logoSize,
      fontDisplay: partial.fontDisplay ?? defaultMenuTheme.fontDisplay,
      fontBody: partial.fontBody ?? defaultMenuTheme.fontBody,
    };
  }

  return { ...defaultMenuTheme, ...partial };
}

// ── Presets ──────────────────────────────────────────────────

export interface ThemePreset {
  name: string;
  description: string;
  colors: Omit<MenuTheme, "logoSize" | "fontDisplay" | "fontBody">;
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

type MenuThemeCssProperties = Record<`--${string}`, string>;

export function themeToCSS(theme: MenuTheme): MenuThemeCssProperties {
  const primaryLight = `${theme.primaryColor}1A`;

  return {
    "--menu-primary": theme.primaryColor,
    "--menu-primary-light": primaryLight,
    "--menu-bg": theme.backgroundColor,
    "--menu-text": theme.textColor,
    "--menu-accent": theme.accentColor,
    "--menu-header-bg": theme.headerBg,
    "--menu-price": theme.priceColor,
    "--menu-card-bg": theme.cardBg,
    "--menu-border": theme.borderColor,
    "--menu-tab-bg": theme.tabBg,
    "--menu-tab-text": theme.tabText,
    "--menu-tab-active-text": theme.tabActiveText,
    "--menu-promo-gradient": theme.promoGradient,
    "--menu-allergen": theme.allergenColor,
    "--menu-allergen-icon": theme.allergenIconColor,
    "--menu-font-display": getFontFamily(theme.fontDisplay),
    "--menu-font-body": getFontFamily(theme.fontBody),
    "--font-display": getFontFamily(theme.fontDisplay),
    "--font-sans": getFontFamily(theme.fontBody),
  };
}
