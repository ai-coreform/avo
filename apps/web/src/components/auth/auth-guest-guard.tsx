"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth/client";

interface AuthGuestGuardProps {
  redirectPath: string;
  children: ReactNode;
}

export function AuthGuestGuard({
  redirectPath,
  children,
}: AuthGuestGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.session) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, session?.session]);

  if (isPending || session?.session) {
    return <div className="min-h-svh bg-background" />;
  }

  return <>{children}</>;
}
