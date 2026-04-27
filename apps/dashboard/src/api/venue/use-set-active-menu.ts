import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menusQueryKeys } from "@/api/menu/use-get-menus";
import { venueApi } from ".";
import type { SetActiveMenuInput } from "./types";
import { venueQueryKeys } from "./use-get-venue";

export function useSetActiveMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetActiveMenuInput) => venueApi.setActiveMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: menusQueryKeys.list() });
    },
  });
}
