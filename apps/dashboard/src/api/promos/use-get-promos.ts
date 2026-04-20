import { useQuery } from "@tanstack/react-query";
import { $getPromos } from "./types";

export const promosQueryKeys = {
  all: ["promos"] as const,
  list: (menuSlug: string) =>
    [...promosQueryKeys.all, "list", menuSlug] as const,
};

export function useGetPromos(menuSlug: string) {
  return useQuery({
    queryKey: promosQueryKeys.list(menuSlug),
    queryFn: async () => {
      const response = await $getPromos({
        param: { menuSlug },
      });
      const json = await response.json();
      return json.data;
    },
  });
}
