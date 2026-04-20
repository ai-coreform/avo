"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@avo/ui/components/ui/sidebar";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import { ChevronsDown, Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSignOut from "@/hooks/use-sign-out";
import type { User } from "@/types/misc";
import { UserAvatarProfile } from "../user-avatar-profile";
import { sidebarData } from "./data/sidebar-data";
import { NavGroup } from "./nav-group";

interface Props {
  user: User | undefined;
}

export default function AppSidebar({ user }: Props) {
  const { signOut, loading } = useSignOut();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mr-auto px-4 py-6">
        <Link className="flex items-center justify-center" href="/menu">
          <Image
            alt="Avo Logo"
            className="h-10 w-auto object-contain"
            height={60}
            priority
            src="/images/avo-logo.svg"
            width={300}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  size="lg"
                >
                  {user ? (
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={user}
                    />
                  ) : (
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  )}
                  <ChevronsDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={signOut}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogOut className="size-4 text-destructive" />
                  )}
                  <span className="text-destructive">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
