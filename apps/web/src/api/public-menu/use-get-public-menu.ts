import { useQuery } from "@tanstack/react-query";
import { publicMenuApi } from ".";

export const publicMenuQueryKeys = {
  all: ["public-menu"] as const,
  detail: (venueSlug: string, menuSlug: string) =>
    [...publicMenuQueryKeys.all, venueSlug, menuSlug] as const,
  translations: (venueSlug: string, menuSlug: string, locale: string) =>
    [
      ...publicMenuQueryKeys.detail(venueSlug, menuSlug),
      "translations",
      locale,
    ] as const,
};

export function useGetPublicMenu(
  venueSlug: string,
  menuSlug: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: publicMenuQueryKeys.detail(venueSlug, menuSlug),
    queryFn: async () => (await publicMenuApi.get(venueSlug, menuSlug)).data,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: options?.enabled,
  });
}
