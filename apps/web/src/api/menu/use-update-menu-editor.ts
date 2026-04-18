import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi } from ".";
import type { UpdateMenuEditorInput } from "./types";
import { menusQueryKeys } from "./use-get-menus";

interface UpdateMenuEditorPayload {
  menuSlug: string;
  data: UpdateMenuEditorInput;
}

export function useUpdateMenuEditor(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuSlug, data }: UpdateMenuEditorPayload) =>
      menusApi.updateEditor(menuSlug, data),
    onSuccess: async (_data, _variables) => {
      // Only invalidate the menu list so cards/sidebar refresh.
      // Do NOT invalidate detail/editor queries — save() already
      // rebuilds local state from the mutation response. Invalidating
      // the editor query triggers a refetch that remounts the editor
      // component (inline Success render-prop) and resets active tab.
      await queryClient.invalidateQueries({
        queryKey: menusQueryKeys.list(),
      });
      options?.onSuccess?.();
    },
  });
}
