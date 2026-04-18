import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface BreadcrumbItem {
  title: string;
  link: string;
}

function formatSegmentTitle(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    const items: BreadcrumbItem[] = [{ title: "Dashboard", link: "/" }];

    if (segments.length === 0) {
      return items;
    }

    let currentPath = "";

    for (const segment of segments) {
      currentPath += `/${segment}`;
      items.push({
        title: formatSegmentTitle(segment),
        link: currentPath,
      });
    }

    return items;
  }, [pathname]);

  return breadcrumbs;
}
