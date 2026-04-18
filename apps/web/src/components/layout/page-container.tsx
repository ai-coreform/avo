import { ScrollArea } from "@avo/ui/components/ui/scroll-area";
import type React from "react";
import { cn } from "@/lib/utils";

export default function PageContainer({
  children,
  scrollable = true,
  className,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-64px)]">
          <div className={cn("flex flex-1 p-4 md:px-6", className)}>
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className={cn("flex flex-1 p-4 md:px-6", className)}>
          {children}
        </div>
      )}
    </>
  );
}
