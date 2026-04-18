import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from ".";

export function useOverviewStats() {
  return useQuery({
    queryKey: ["overview", "stats"],
    queryFn: getOverviewStats,
  });
}
