import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi } from ".";
import type { UpdateMenuInput } from "./types";
import { menusQueryKeys } from "./use-get-menus";

interface UpdateMenuPayload {
  menuSlug: string;
  data: UpdateMenuInput;
}

export function useUpdateMenu(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuSlug, data }: UpdateMenuPayload) =>
      menusApi.update(menuSlug, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.detail(variables.menuSlug),
      });
      options?.onSuccess?.();
    },
  });
}
