import { useQuery } from "@tanstack/react-query";
import { venueApi } from ".";

export const venueQueryKeys = {
  all: ["venue"] as const,
  detail: () => [...venueQueryKeys.all, "detail"] as const,
};

export function useGetVenue() {
  return useQuery({
    queryKey: venueQueryKeys.detail(),
    queryFn: async () => {
      const response = await venueApi.get();
      return response.data;
    },
  });
}
