"use client";

import { defaultMenuTheme, type MenuTheme } from "@avo/menu/menu-theme";
import { createContext, useContext } from "react";

const MenuThemeContext = createContext<MenuTheme>(defaultMenuTheme);

export const MenuThemeProvider = MenuThemeContext.Provider;

export function useMenuTheme() {
  return useContext(MenuThemeContext);
}
