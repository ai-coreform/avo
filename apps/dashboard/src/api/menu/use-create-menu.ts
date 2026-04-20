import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi } from ".";
import { menusQueryKeys } from "./use-get-menus";

export function useCreateMenu(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof menusApi.create>[0]) =>
      menusApi.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.all,
      });
      options?.onSuccess?.();
    },
  });
}
