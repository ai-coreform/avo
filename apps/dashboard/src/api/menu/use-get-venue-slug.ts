import { useQueryClient } from "@tanstack/react-query";
import { menusQueryKeys } from "./use-get-menus";

/**
 * Reads the venue slug from the cached menus list query.
 * Returns null if the data is not yet cached.
 */
export function useVenueSlug(): string | null {
  const queryClient = useQueryClient();

  const data = queryClient.getQueryData<{
    menus: unknown[];
    venueSlug: string | null;
  }>(menusQueryKeys.list());

  return data?.venueSlug ?? null;
}
