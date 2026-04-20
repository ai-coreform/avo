import { StaticMenuDemo } from "@/components/landing/static-menu-demo";

export function HeroPhoneMockup() {
  const borderWidth = 7;
  const frameWidth = 300;
  const innerWidth = frameWidth - borderWidth * 2; // 286px visible
  const contentWidth = 390;
  const scale = innerWidth / contentWidth; // ~0.733
  // iPhone 15 body ratio ~2.06:1 (71.6 x 147.6mm). Status bar is ~35px.
  const statusBarHeight = 35;
  const visibleHeight = Math.round(innerWidth * 2.06) - statusBarHeight;

  return (
    <div className="relative mx-auto" style={{ width: frameWidth }}>
      <div
        className="overflow-hidden"
        style={{
          borderRadius: 40,
          border: `${borderWidth}px solid #1a1a1a`,
          boxShadow:
            "0 50px 100px -25px rgba(0,0,0,0.18), 0 20px 40px -15px rgba(0,0,0,0.10)",
        }}
      >
        {/* Status bar with notch */}
        <div className="relative bg-white px-5 pt-3 pb-1">
          <div className="absolute top-0 left-1/2 h-[24px] w-[100px] -translate-x-1/2 rounded-b-2xl bg-[#1a1a1a]" />
          <div className="flex items-center justify-between pt-0.5">
            <span className="font-semibold text-[10px] text-ink/50">9:41</span>
            <div className="flex gap-1">
              <div className="h-[7px] w-[18px] rounded-sm bg-ink/20" />
              <div className="h-[7px] w-[7px] rounded-sm bg-ink/20" />
            </div>
          </div>
        </div>

        {/* Scaled interactive menu — renders at 390px, scaled to fit inner width */}
        <div
          className="relative overflow-hidden"
          style={{ height: visibleHeight }}
        >
          <div
            style={{
              width: contentWidth,
              height: visibleHeight / scale,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}
          >
            <StaticMenuDemo height={visibleHeight / scale} />
          </div>

          {/* Home indicator — floats over content */}
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-3 pb-2">
            <div className="h-[4px] w-[100px] rounded-full bg-ink/[0.12]" />
          </div>
        </div>
      </div>
    </div>
  );
}
