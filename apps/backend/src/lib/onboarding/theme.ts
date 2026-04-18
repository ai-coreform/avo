import type { MenuThemeData } from "@/types/menu-theme";

const DEFAULT_PROMO_GRADIENT =
  "linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)";

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

/**
 * Given a partial set of colors (typically from a website scan), produce a
 * complete, coherent set of theme colors.
 */
export function deriveFullThemeColors(
  primary: string,
  bg?: string,
  accent?: string
): MenuThemeData {
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
    promoGradient: DEFAULT_PROMO_GRADIENT,
    allergenColor: primary,
    allergenIconColor: primaryIsDark ? "#FFFFFF" : "#1A1A1A",
  };
}
