import { useMutation, useQueryClient } from "@tanstack/react-query";
import { venueApi } from ".";
import type { UpdateVenueInput } from "./types";
import { venueQueryKeys } from "./use-get-venue";

export function useUpdateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVenueInput) => venueApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueQueryKeys.all });
    },
  });
}
