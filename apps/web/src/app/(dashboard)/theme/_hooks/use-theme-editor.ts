"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { menusApi } from "@/api/menu";
import type { MenuListItem } from "@/api/menu/types";
import { menusQueryKeys } from "@/api/menu/use-get-menus";
import {
  defaultMenuTheme,
  type MenuTheme,
} from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_utils/menu-theme";

interface UseThemeEditorOptions {
  menu: MenuListItem | null;
}

export function useThemeEditor({ menu }: UseThemeEditorOptions) {
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<MenuTheme>({ ...defaultMenuTheme });
  const [isDirty, setIsDirty] = useState(false);

  const savedThemeRef = useRef<string>("");
  const currentMenuIdRef = useRef<string | null>(null);

  // Hydrate theme from selected menu
  useEffect(() => {
    if (!menu) {
      return;
    }

    // Only re-hydrate when the menu changes
    if (currentMenuIdRef.current === menu.id) {
      return;
    }
    currentMenuIdRef.current = menu.id;

    const saved = menu.theme as Partial<MenuTheme> | null | undefined;
    const merged = { ...defaultMenuTheme, ...saved };

    setTheme(merged);
    savedThemeRef.current = JSON.stringify(merged);
    setIsDirty(false);
  }, [menu]);

  const updateTheme = useCallback(
    <K extends keyof MenuTheme>(key: K, value: MenuTheme[K]) => {
      setTheme((prev) => {
        const next = { ...prev, [key]: value };
        setIsDirty(JSON.stringify(next) !== savedThemeRef.current);
        return next;
      });
    },
    []
  );

  const applyPreset = useCallback((colors: Record<string, string>) => {
    setTheme((prev) => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(colors)) {
        (next as Record<string, unknown>)[key] = val;
      }
      setIsDirty(JSON.stringify(next) !== savedThemeRef.current);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const defaults = { ...defaultMenuTheme };
    setTheme(defaults);
    setIsDirty(JSON.stringify(defaults) !== savedThemeRef.current);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!menu) {
        throw new Error("No menu selected");
      }
      await menusApi.update(menu.slug, { theme });
    },
    onSuccess: async () => {
      savedThemeRef.current = JSON.stringify(theme);
      setIsDirty(false);
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.all,
      });
    },
  });

  const handleSave = useCallback(() => {
    toast.promise(saveMutation.mutateAsync(), {
      loading: "Salvataggio tema...",
      success: "Tema salvato",
      error: "Errore nel salvataggio",
    });
  }, [saveMutation]);

  return {
    theme,
    isDirty,
    isSaving: saveMutation.isPending,
    updateTheme,
    applyPreset,
    handleReset,
    handleSave,
  };
}
