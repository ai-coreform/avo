import { useQuery } from "@tanstack/react-query";
import { getVenue } from ".";

export function useGetVenue(venueId: string) {
  return useQuery({
    queryKey: ["platform", "venues", venueId],
    queryFn: () => getVenue(venueId),
    enabled: !!venueId,
  });
}
