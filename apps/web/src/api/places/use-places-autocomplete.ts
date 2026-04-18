import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { placesApi } from ".";

const DEBOUNCE_MS = 300;

export function usePlacesAutocomplete() {
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, DEBOUNCE_MS);
  }, []);

  const query = useQuery({
    queryKey: ["places", "autocomplete", debouncedSearch],
    queryFn: async () => {
      const response = await placesApi.autocomplete(debouncedSearch);
      return response.data.suggestions;
    },
    enabled: debouncedSearch.length >= 2,
  });

  return {
    search,
    setSearch,
    suggestions: query.data ?? [],
    isLoading: query.isFetching,
  };
}
