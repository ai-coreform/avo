import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  $createPromo,
  $deletePromo,
  $sortPromos,
  $updatePromo,
  type CreatePromoInput,
  type UpdatePromoInput,
} from "./types";
import { promosQueryKeys } from "./use-get-promos";

export function useCreatePromo(menuSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePromoInput) => {
      const response = await $createPromo({
        param: { menuSlug },
        json: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promosQueryKeys.list(menuSlug),
      });
    },
  });
}

export function useUpdatePromo(menuSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      promoId,
      data,
    }: {
      promoId: string;
      data: UpdatePromoInput;
    }) => {
      const response = await $updatePromo({
        param: { menuSlug, promoId },
        json: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promosQueryKeys.list(menuSlug),
      });
    },
  });
}

export function useDeletePromo(menuSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promoId: string) => {
      const response = await $deletePromo({
        param: { menuSlug, promoId },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promosQueryKeys.list(menuSlug),
      });
    },
  });
}

export function useSortPromos(menuSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const response = await $sortPromos({
        param: { menuSlug },
        json: { items },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promosQueryKeys.list(menuSlug),
      });
    },
  });
}
