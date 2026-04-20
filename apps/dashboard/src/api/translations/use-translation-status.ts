import { useQuery } from "@tanstack/react-query";
import { translationsApi } from ".";

export const TRANSLATION_STATUS_QUERY_KEY = ["translation-status"] as const;

export function useTranslationStatus() {
  return useQuery({
    queryKey: TRANSLATION_STATUS_QUERY_KEY,
    queryFn: () => translationsApi.getStatus(),
    refetchInterval: (query) => {
      const status = query.state.data?.data.job?.status;
      return status === "running" || status === "pending" ? 2000 : false;
    },
  });
}
