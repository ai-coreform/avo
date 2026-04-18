"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVenue } from ".";

export function useDeleteVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "venues"] });
    },
  });
}
