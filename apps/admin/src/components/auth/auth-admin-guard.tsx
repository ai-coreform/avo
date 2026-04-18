"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Spinner } from "@avo/ui/components/ui/spinner";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth/client";

interface AuthAdminGuardProps {
  children: ReactNode;
}

export function AuthAdminGuard({ children }: AuthAdminGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!(isPending || session?.session)) {
      const currentPath = window.location.pathname;
      router.replace(`/login?redirect_to=${encodeURIComponent(currentPath)}`);
    }
  }, [isPending, router, session?.session]);

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!session?.session) {
    return <div className="min-h-svh bg-background" />;
  }

  if (session.user.role !== "superadmin") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Access Denied</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            You need superadmin privileges to access this platform.
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            Signed in as {session.user.email}
          </p>
          <Button
            className="mt-4"
            onClick={async () => {
              await authClient.signOut();
              router.replace("/login");
            }}
            variant="outline"
          >
            Sign out and use a different account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
