import { useQuery } from "@tanstack/react-query";
import { translationsApi } from ".";

export const TRANSLATION_STATS_QUERY_KEY = ["translation-stats"] as const;

export function useTranslationStats(isJobRunning = false) {
  return useQuery({
    queryKey: TRANSLATION_STATS_QUERY_KEY,
    queryFn: () => translationsApi.getStats(),
    refetchInterval: isJobRunning ? 2000 : false,
  });
}
