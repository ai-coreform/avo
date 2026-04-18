import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi } from ".";
import { menusQueryKeys } from "./use-get-menus";

export function useDeleteMenu(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuSlug: string) => menusApi.delete(menuSlug),
    onSuccess: async (_data, menuSlug) => {
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.all,
      });
      await queryClient.removeQueries({
        queryKey: menusQueryKeys.detail(menuSlug),
      });
      options?.onSuccess?.();
    },
  });
}
