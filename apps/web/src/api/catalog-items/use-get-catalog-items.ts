import { useQuery } from "@tanstack/react-query";
import { $getCatalogItems } from "./types";

export const catalogItemsQueryKeys = {
  all: ["catalog-items"] as const,
  list: (params?: { search?: string }) =>
    [...catalogItemsQueryKeys.all, "list", params] as const,
};

export function useGetCatalogItems(params?: { search?: string }) {
  return useQuery({
    queryKey: catalogItemsQueryKeys.list(params),
    queryFn: async () => {
      const response = await $getCatalogItems({
        query: {
          search: params?.search,
        },
      });
      const json = await response.json();
      return json.data;
    },
  });
}
