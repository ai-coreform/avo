import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

export function useGetActiveMember() {
  return useQuery({
    queryKey: teamQueryKeys.activeMember(),
    queryFn: async () => {
      const response = await authClient.organization.getActiveMember();
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nel caricamento del ruolo"
        );
      }
      return response.data;
    },
  });
}
