"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMember } from ".";

export function useUpdateMember(venueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Record<string, unknown>;
    }) => updateMember(venueId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["platform", "venues", venueId],
      });
    },
  });
}
