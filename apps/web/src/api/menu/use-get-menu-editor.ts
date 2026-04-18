import { useQuery } from "@tanstack/react-query";
import { menusApi } from ".";
import { menusQueryKeys } from "./use-get-menus";

export function useGetMenuEditor(menuSlug: string) {
  return useQuery({
    queryKey: menusQueryKeys.editor(menuSlug),
    queryFn: async () => {
      const response = await menusApi.getEditor(menuSlug);
      return {
        ...response.data,
        venueSlug: response.venueSlug,
        venueName: response.venueName,
        venueLogo: response.venueLogo,
      };
    },
  });
}
