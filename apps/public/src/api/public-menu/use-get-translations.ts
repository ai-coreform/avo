import { useQuery } from "@tanstack/react-query";
import { publicMenuApi } from ".";
import { publicMenuQueryKeys } from "./use-get-public-menu";

export function useGetTranslations(
  venueSlug: string,
  menuSlug: string,
  locale: string | null,
  defaultLocale: string
) {
  return useQuery({
    queryKey: publicMenuQueryKeys.translations(
      venueSlug,
      menuSlug,
      locale ?? ""
    ),
    queryFn: async () => {
      const result = await publicMenuApi.getTranslations(
        venueSlug,
        menuSlug,
        locale as string
      );
      return result.data;
    },
    enabled: !!locale && locale !== defaultLocale,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
