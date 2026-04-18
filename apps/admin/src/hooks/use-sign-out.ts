"use client";

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
      router.replace("/login");
    },
  });

  return {
    signOut: async () =>
      toast.promise(signOut(), {
        loading: "Signing out...",
        success: "Signed out successfully",
        error: "Failed to sign out. Please try again.",
      }),
    loading: isPending,
  };
}

export default useSignOut;
