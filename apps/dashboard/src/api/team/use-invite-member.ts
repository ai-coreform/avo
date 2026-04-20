import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { teamQueryKeys } from "./query-keys";

interface InviteMemberInput {
  email: string;
  role: "admin" | "member";
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: InviteMemberInput) => {
      const response = await authClient.organization.inviteMember({
        email,
        role,
      });
      if (response.error) {
        throw new Error(
          response.error.message ?? "Errore nell'invio dell'invito"
        );
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Invito inviato a ${variables.email}`);
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.invitations() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
