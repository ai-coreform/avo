import { useQuery } from "@tanstack/react-query";
import { listVenues } from ".";

export function useListVenues(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["platform", "venues", params],
    queryFn: () => listVenues(params),
  });
}
