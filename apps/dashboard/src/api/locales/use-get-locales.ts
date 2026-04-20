import { useQuery } from "@tanstack/react-query";
import { localesApi } from ".";

export const LOCALES_QUERY_KEY = ["locales"] as const;

export function useGetLocales() {
  return useQuery({
    queryKey: LOCALES_QUERY_KEY,
    queryFn: () => localesApi.list(),
  });
}
