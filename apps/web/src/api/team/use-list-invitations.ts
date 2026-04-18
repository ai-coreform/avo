import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

export function useListInvitations() {
  return useQuery({
    queryKey: teamQueryKeys.invitations(),
    queryFn: async () => {
      const response = await authClient.organization.listInvitations();
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nel caricamento degli inviti"
        );
      }
      return response.data;
    },
  });
}
