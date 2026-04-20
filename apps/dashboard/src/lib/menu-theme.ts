"use client";

import { createContext, useContext } from "react";

export interface MenuTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontDisplay: string;
  fontBody: string;
}

export const defaultMenuTheme: MenuTheme = {
  primaryColor: "#1A1A1A",
  backgroundColor: "#FFFFFF",
  textColor: "#1A1A1A",
  accentColor: "#F0F0F0",
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
    "--menu-font-display": getFontFamily(theme.fontDisplay),
    "--menu-font-body": getFontFamily(theme.fontBody),
  } as React.CSSProperties;
}
