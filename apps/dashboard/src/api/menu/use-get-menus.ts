import { useQuery } from "@tanstack/react-query";
import { menusApi } from ".";

export const menusQueryKeys = {
  all: ["menus"] as const,
  list: () => [...menusQueryKeys.all, "list"] as const,
  detail: (menuSlug: string) =>
    [...menusQueryKeys.all, "detail", menuSlug] as const,
  editor: (menuSlug: string) =>
    [...menusQueryKeys.detail(menuSlug), "editor"] as const,
  preview: (menuSlug: string) =>
    [...menusQueryKeys.detail(menuSlug), "preview"] as const,
};

export function useGetMenus() {
  return useQuery({
    queryKey: menusQueryKeys.list(),
    queryFn: async () => {
      const response = await menusApi.list();
      return {
        menus: response.data,
        venueSlug: response.venueSlug,
        activeMenuId: response.activeMenuId,
      };
    },
  });
}
