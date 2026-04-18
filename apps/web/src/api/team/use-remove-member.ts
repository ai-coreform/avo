import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

interface RemoveMemberInput {
  memberIdOrEmail: string;
  displayName?: string;
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberIdOrEmail }: RemoveMemberInput) => {
      const response = await authClient.organization.removeMember({
        memberIdOrEmail,
      });
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nella rimozione del membro"
        );
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.displayName
          ? `${variables.displayName} rimosso dal team`
          : "Membro rimosso dal team"
      );
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
