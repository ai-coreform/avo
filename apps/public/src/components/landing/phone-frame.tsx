import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: 280 }}>
      <div
        className="overflow-hidden bg-cream"
        style={{
          borderRadius: 36,
          border: "6px solid #2C2420",
          boxShadow: "0 40px 80px -20px rgba(44,36,32,0.18)",
        }}
      >
        {/* Status bar */}
        <div className="relative bg-cream px-5 pt-3 pb-1">
          <div className="absolute top-0 left-1/2 h-[22px] w-[90px] -translate-x-1/2 rounded-b-2xl bg-[#2C2420]" />
          <div className="flex items-center justify-between pt-0.5">
            <span className="font-semibold text-[10px] text-ink/50">9:41</span>
            <div className="flex gap-1">
              <div className="h-[7px] w-[18px] rounded-sm bg-ink/25" />
              <div className="h-[7px] w-[7px] rounded-sm bg-ink/25" />
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="bg-cream">{children}</div>
        {/* Home indicator */}
        <div className="flex justify-center bg-cream pt-1 pb-2">
          <div className="h-[4px] w-[100px] rounded-full bg-ink/15" />
        </div>
      </div>
    </div>
  );
}
