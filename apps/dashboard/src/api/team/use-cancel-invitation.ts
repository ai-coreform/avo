import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

interface CancelInvitationInput {
  invitationId: string;
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: CancelInvitationInput) => {
      const response = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nell'annullamento dell'invito"
        );
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invito annullato");
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.invitations() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
