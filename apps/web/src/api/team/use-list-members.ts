import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

export function useListMembers() {
  return useQuery({
    queryKey: teamQueryKeys.members(),
    queryFn: async () => {
      const response = await authClient.organization.listMembers();
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nel caricamento dei membri"
        );
      }
      return response.data.members;
    },
  });
}
