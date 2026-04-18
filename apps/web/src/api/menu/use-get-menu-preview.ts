import { useQuery } from "@tanstack/react-query";
import { menusApi } from ".";
import { menusQueryKeys } from "./use-get-menus";

export function useGetMenuPreview(
  menuSlug: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: menusQueryKeys.preview(menuSlug),
    queryFn: async () => {
      const response = await menusApi.getPreview(menuSlug);
      return response.data;
    },
    enabled: options?.enabled,
  });
}
