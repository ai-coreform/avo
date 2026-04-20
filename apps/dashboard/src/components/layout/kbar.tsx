"use client";
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
} from "kbar";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { sidebarData } from "./data/sidebar-data";
import RenderResults from "./render-result";

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // These action are for the navigation
  const actions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    return sidebarData.navGroups.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction = navItem.items.some((item) => item.url !== "#")
        ? {
            id: `${navItem.title.toLowerCase()}Action`,
            name: navItem.title,
            shortcut: navItem.items.find((item) => item.url !== "#")?.shortcut,
            keywords: navItem.title.toLowerCase(),
            section: "Navigation",
            subtitle: `Go to ${navItem.title}`,
            perform: () =>
              navigateTo(
                navItem.items.find((item) => item.url !== "#")?.url ?? ""
              ),
          }
        : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Go to ${childItem.title}`,
          perform: () => navigateTo(childItem.url ?? ""),
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });
  }, [router]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => (
  <>
    <KBarPortal>
      <KBarPositioner className="fixed inset-0 z-99999 bg-background/80 p-0! backdrop-blur-sm">
        <KBarAnimator className="relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg">
          <div className="sticky top-0 z-10 border-border border-b bg-card">
            <KBarSearch className="w-full border-none bg-card px-6 py-4 text-lg outline-hidden focus:outline-hidden focus:ring-0 focus:ring-offset-0" />
          </div>
          <div className="max-h-[400px]">
            <RenderResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
    {children}
  </>
);
