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

  const isSuperadmin = session?.user?.role === "superadmin";

  useEffect(() => {
    if (session?.session && isSuperadmin) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, session?.session, isSuperadmin]);

  if (isPending) {
    return <div className="min-h-svh bg-background" />;
  }

  if (session?.session && isSuperadmin) {
    return <div className="min-h-svh bg-background" />;
  }

  return <>{children}</>;
}
