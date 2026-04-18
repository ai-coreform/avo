"use client";
import { Separator } from "@avo/ui/components/ui/separator";
import { SidebarTrigger } from "@avo/ui/components/ui/sidebar";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "../breadcrumbs";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export default function Header({
  className,
  fixed,
  children,
  ...props
}: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  const shouldShowShadow = offset > 10 && fixed;
  const shouldShowBackdrop = offset > 10 && fixed;

  const headerClasses = [
    "z-50 h-16",
    fixed && "header-fixed peer/header sticky top-0 w-[inherit]",
    shouldShowShadow ? "shadow" : "shadow-none",
    className,
  ].filter(Boolean);

  const divClasses = [
    "relative flex h-full items-center gap-3 p-4 sm:gap-4",
    shouldShowBackdrop &&
      "after:-z-10 after:absolute after:inset-0 after:bg-background/20 after:backdrop-blur-lg",
  ].filter(Boolean);

  return (
    <header className={cn(...headerClasses)} {...props}>
      <div className={cn(...divClasses)}>
        <SidebarTrigger className="max-md:scale-125" variant="outline" />
        <Separator className="h-6" orientation="vertical" />
        <Breadcrumbs />
        {children}
        <div className="ml-auto">
          {/* <ThemeToggle /> */}
          {/* <SearchInput /> */}
        </div>
      </div>
    </header>
  );
}
