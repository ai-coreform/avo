"use client";

import { SidebarInset, SidebarProvider } from "@avo/ui/components/ui/sidebar";
import { AuthAdminGuard } from "@/components/auth/auth-admin-guard";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { authClient } from "@/lib/auth/client";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";
import { LayoutProvider } from "@/providers/layout-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = getCookie("sidebar_state") !== "false";
  const { data } = authClient.useSession();

  return (
    <AuthAdminGuard>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar user={data?.user} />
          <SidebarInset
            className={cn(
              "@container/content",
              "has-data-[layout=fixed]:h-svh",
              "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]"
            )}
          >
            <Header fixed />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </AuthAdminGuard>
  );
}
