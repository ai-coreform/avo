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
  useSidebar,
} from "@avo/ui/components/ui/sidebar";
import { Skeleton } from "@avo/ui/components/ui/skeleton";
import {
  ChevronsDown,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  QrCode,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuListItem } from "@/api/menu/types";
import { useGetMenus } from "@/api/menu/use-get-menus";
import { useGetVenue } from "@/api/venue/use-get-venue";
import { VenueQrDialog } from "@/app/(dashboard)/menu/_components/venue-qr-dialog";
import useSignOut from "@/hooks/use-sign-out";
import { useLayout } from "@/providers/layout-provider";
import type { User } from "@/types/misc";
import { UserAvatarProfile } from "../user-avatar-profile";
import { sidebarData } from "./data/sidebar-data";
import { NavGroup } from "./nav-group";

interface Props {
  user: User | undefined;
}

export default function AppSidebar({ user }: Props) {
  const { signOut, loading } = useSignOut();
  const { state: sidebarState } = useSidebar();
  const { showPreview, togglePreview } = useLayout();
  const menusQuery = useGetMenus();
  const venueQuery = useGetVenue();
  const venueSlug = menusQuery.data?.venueSlug;
  const activeMenuId = menusQuery.data?.activeMenuId;
  const venueLogo = venueQuery.data?.logo ?? null;
  const [qrOpen, setQrOpen] = useState(false);

  // Find the active menu for the "Menu Live" link, falling back to first published menu
  const menus: MenuListItem[] = menusQuery.data?.menus ?? [];
  const liveMenu = activeMenuId
    ? menus.find((m) => m.id === activeMenuId)
    : menus.find((m) => m.status === "published");
  const menuLiveUrl =
    venueSlug && liveMenu ? `/m/${venueSlug}/${liveMenu.slug}` : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mr-auto h-16 justify-center px-4">
        <Link className="flex items-center justify-center" href="/menu">
          {sidebarState === "collapsed" ? (
            <Image
              alt="Avo"
              className="size-8 object-contain"
              height={32}
              priority
              src="/images/avo-icon-color.png"
              width={32}
            />
          ) : (
            <Image
              alt="Avo Logo"
              className="h-10 w-auto object-contain"
              height={60}
              priority
              src="/images/avo-logo.svg"
              width={300}
            />
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className="pt-0">
        <SidebarMenu>
          {venueSlug && (
            <>
              <div className="mb-1 h-px bg-border" />
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setQrOpen(true)}>
                  <QrCode className="size-4" />
                  <span className="flex-1 font-medium">QR Code</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          {menuLiveUrl && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Smartphone className="size-4" />
                    <span className="flex-1 font-medium">Menu Live</span>
                    <span className="size-2 rounded-full bg-green-500" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="top"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={togglePreview}>
                    <Smartphone className="size-4" />
                    {showPreview ? "Chiudi preview" : "Apri preview"}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={menuLiveUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-4" />
                      Apri link
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const fullUrl = `${window.location.origin}${menuLiveUrl}`;
                      navigator.clipboard.writeText(fullUrl);
                      toast.success("Link copiato negli appunti");
                    }}
                  >
                    <Copy className="size-4" />
                    Copia link del menu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
          <div className="my-1 h-px bg-border" />
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
      {venueSlug && (
        <VenueQrDialog
          onOpenChange={setQrOpen}
          open={qrOpen}
          venueLogo={venueLogo}
          venueSlug={venueSlug}
        />
      )}
    </Sidebar>
  );
}
