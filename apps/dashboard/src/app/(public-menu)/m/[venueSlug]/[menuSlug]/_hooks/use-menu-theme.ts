"use client";

import { createContext, useContext } from "react";
import { defaultMenuTheme, type MenuTheme } from "../_utils/menu-theme";

const MenuThemeContext = createContext<MenuTheme>(defaultMenuTheme);

export const MenuThemeProvider = MenuThemeContext.Provider;

export function useMenuTheme() {
  return useContext(MenuThemeContext);
}
