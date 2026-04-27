"use client";
import { SidebarTrigger } from "@avo/ui/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  usePageHeaderActions,
  usePageHeaderTitle,
} from "@/providers/page-header-provider";
import { sidebarData } from "./data/sidebar-data";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
};

interface PageInfo {
  icon?: React.ElementType;
  title: string;
  url: string;
}

/** Flatten all sidebar nav items (including nested sub-items) into a flat list. */
function flattenSidebarItems(): PageInfo[] {
  const items: PageInfo[] = [];
  for (const group of sidebarData.navGroups) {
    for (const item of group.items) {
      if ("url" in item && item.url) {
        items.push({ icon: item.icon, title: item.title, url: item.url });
      }
      if ("items" in item && item.items) {
        for (const sub of item.items) {
          items.push({ icon: sub.icon, title: sub.title, url: sub.url });
        }
      }
    }
  }
  return items;
}

const allPageItems = flattenSidebarItems();

function matchPathToPage(pathname: string): PageInfo | null {
  let best: PageInfo | null = null;
  for (const page of allPageItems) {
    const isMatch =
      pathname === page.url || pathname.startsWith(`${page.url}/`);
    if (isMatch && (!best || page.url.length > best.url.length)) {
      best = page;
    }
  }
  return best;
}

function useCurrentPageInfo() {
  const pathname = usePathname();
  return useMemo(() => matchPathToPage(pathname), [pathname]);
}

export default function Header({ className, fixed, ...props }: HeaderProps) {
  const pageInfo = useCurrentPageInfo();
  const actions = usePageHeaderActions();
  const titleOverride = usePageHeaderTitle();

  const Icon = pageInfo?.icon;

  return (
    <header
      className={cn(
        "z-50 h-16 shrink-0 border-b bg-background",
        fixed && "header-fixed peer/header sticky top-0 w-[inherit]",
        className
      )}
      {...props}
    >
      <div className="flex h-full items-center gap-3 px-4 sm:gap-4">
        <SidebarTrigger variant="ghost" />
        <div className="h-5 w-px shrink-0 bg-border" />

        {/* Page icon + title (or custom title override from page) */}
        {titleOverride ??
          (pageInfo && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              <h1 className="font-semibold text-lg">{pageInfo.title}</h1>
            </div>
          ))}

        {/* Page-specific action buttons */}
        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
