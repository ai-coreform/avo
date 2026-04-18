import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

function useSignOut() {
  const router = useRouter();

  const { mutateAsync: signOut, isPending } = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      router.replace("/accedi");
    },
  });

  return {
    signOut: async () =>
      toast.promise(signOut(), {
        loading: "Uscita in corso...",
        success: "Disconnessione completata",
        error: "Non siamo riusciti a disconnetterti. Riprova.",
      }),
    loading: isPending,
  };
}

export default useSignOut;
