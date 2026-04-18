"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVenue } from ".";

export function useUpdateVenue(venueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateVenue(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["platform", "venues", venueId],
      });
    },
  });
}
