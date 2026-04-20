"use client";

import {
  BeanIcon,
  EggIcon,
  FishFoodIcon,
  MilkBottleIcon,
  NutIcon,
  ShellfishIcon,
  WheatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight,
  Check,
  Globe,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CLIENT_CYCLE_DURATION = 5000;

const clientFeatures = [
  {
    id: "qr",
    icon: QrCode,
    title: "Il menu sempre a portata di mano",
    description:
      "I clienti inquadrano il QR code e hanno il menu completo sul telefono. Nessuna app, nessuna attesa. Basta uno scan.",
  },
  {
    id: "translate",
    icon: Globe,
    title: "Parla tutte le lingue del mondo",
    description:
      "Il menu si traduce automaticamente in oltre 30 lingue. Ogni turista legge piatti e descrizioni nella propria lingua madre.",
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "Un assistente AI a ogni tavolo",
    description:
      "I clienti chiedono consigli, abbinamenti e alternative e ricevono risposte in tempo reale, nella loro lingua, 24/7.",
  },
  {
    id: "allergens",
    icon: ShieldCheck,
    title: "Allergeni sempre sotto controllo",
    description:
      "Ogni piatto mostra chiaramente gli allergeni. I clienti con intolleranze consultano il menu in totale sicurezza e autonomia.",
  },
];

export function ClientFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) {
      return;
    }
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView) {
      return;
    }
    const tick = 50;
    progressRef.current = progress;
    const id = setInterval(() => {
      progressRef.current += (tick / CLIENT_CYCLE_DURATION) * 100;
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % clientFeatures.length);
      } else {
        setProgress(progressRef.current);
      }
    }, tick);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, activeIndex, inView]);

  const selectTab = (i: number) => {
    progressRef.current = 0;
    setActiveIndex(i);
    setProgress(0);
  };

  return (
    <section
      className="scroll-mt-20 py-14 md:py-20"
      id="prodotto"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid items-center gap-16 md:grid-cols-[1fr_auto] md:gap-20">
          {/* Left: text + accordion items */}
          <div>
            <h2 className="font-bold font-display text-[clamp(1.6rem,3vw,2.5rem)] text-ink leading-tight tracking-tight">
              Con Avo, il tuo ristorante fa un salto di qualità
            </h2>
            <p className="mt-4 max-w-md text-base text-ink/50 leading-relaxed">
              Più clienti soddisfatti, meno lavoro per te.
            </p>

            <div className="mt-6 space-y-0">
              {clientFeatures.map((feature, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    className="relative w-full border-ink/8 border-b py-5 text-left"
                    key={feature.id}
                    onClick={() => selectTab(i)}
                    onMouseEnter={() => isActive && setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    type="button"
                  >
                    <div className="absolute right-0 bottom-[-1px] left-0 h-[2px]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: isActive ? `${progress}%` : "0%",
                          transition: "none",
                        }}
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <feature.icon
                        className={cn(
                          "mt-0.5 size-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-ink/25"
                        )}
                        strokeWidth={1.8}
                      />
                      <div>
                        <h3
                          className={cn(
                            "font-display font-semibold text-[15px] transition-colors",
                            isActive ? "text-ink" : "text-ink/50"
                          )}
                        >
                          {feature.title}
                        </h3>
                        <div
                          className={cn(
                            "grid transition-all duration-300",
                            isActive
                              ? "mt-2 grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="max-w-md text-ink/50 text-sm leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Illustration */}
          <div className="mx-auto flex h-[320px] w-full max-w-[280px] items-center justify-center md:h-[380px] md:w-[320px] md:max-w-none">
            <div
              className="fade-in slide-in-from-bottom-2 relative animate-in duration-400"
              key={activeIndex}
            >
              {activeIndex === 0 && <QrIllustration />}
              {activeIndex === 1 && <TranslationsIllustration />}
              {activeIndex === 2 && <AiChatIllustration />}
              {activeIndex === 3 && <AllergensIllustration />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QrIllustration() {
  return (
    <div className="relative flex h-[380px] w-[280px] items-center justify-center">
      {/* Background QR code */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[140px] w-[140px] items-center justify-center rounded-2xl border border-ink/6 bg-white/40 p-3">
          <div className="grid h-[110px] w-[110px] grid-cols-11 grid-rows-11 gap-[2px]">
            {Array.from({ length: 121 }).map((_, k) => {
              const row = Math.floor(k / 11);
              const col = k % 11;
              const isTopLeft = row < 3 && col < 3;
              const isTopRight = row < 3 && col > 7;
              const isBottomLeft = row > 7 && col < 3;
              const isAlignment =
                row >= 7 &&
                row <= 9 &&
                col >= 7 &&
                col <= 9 &&
                !(row === 8 && col === 8);
              const isAlignCenter = row === 8 && col === 8;
              const isTiming =
                (row === 3 && col > 2 && col < 8 && col % 2 === 0) ||
                (col === 3 && row > 2 && row < 8 && row % 2 === 0);
              const dataFilled = [
                15, 17, 26, 28, 30, 37, 39, 41, 48, 50, 52, 54, 59, 61, 63, 70,
                72, 74, 76, 81, 83, 85, 92, 94, 96, 103, 105, 107,
              ].includes(k);
              const isFilled =
                isTopLeft ||
                isTopRight ||
                isBottomLeft ||
                isAlignment ||
                isAlignCenter ||
                isTiming ||
                dataFilled;
              return (
                <div
                  className="rounded-[1.5px]"
                  key={k}
                  style={{
                    backgroundColor: isFilled
                      ? "var(--primary)"
                      : "rgba(0,0,0,0.05)",
                    opacity: isFilled ? 0.35 : 0.5,
                  }}
                />
              );
            })}
          </div>

          {/* Scan frame corners */}
          <div className="absolute top-1.5 left-1.5 h-4 w-4 rounded-tl-md border-primary/30 border-t-2 border-l-2" />
          <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-tr-md border-primary/30 border-t-2 border-r-2" />
          <div className="absolute bottom-1.5 left-1.5 h-4 w-4 rounded-bl-md border-primary/30 border-b-2 border-l-2" />
          <div className="absolute right-1.5 bottom-1.5 h-4 w-4 rounded-br-md border-primary/30 border-r-2 border-b-2" />

          {/* Laser scan line */}
          <div
            className="absolute right-2.5 left-2.5 h-[2px] animate-[qrScan_2.8s_ease-in-out_infinite] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.5) 20%, #22c55e 50%, rgba(34,197,94,0.5) 80%, transparent 100%)",
              boxShadow: "0 0 10px 2px rgba(34,197,94,0.3)",
            }}
          />
        </div>
      </div>

      {/* Floating menu page — top left */}
      <div className="absolute top-2 -left-2 z-10 h-[148px] w-[105px] rotate-[-10deg] rounded-2xl border border-ink/8 bg-white/95 p-3 shadow-ink/[0.06] shadow-lg backdrop-blur-sm">
        <div className="mb-2.5 flex gap-1">
          <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-[6px] text-white">
            Pizze
          </span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-medium text-[6px] text-ink/30">
            Primi
          </span>
        </div>
        <div className="space-y-2.5">
          {[
            { name: "Margherita", price: "8.50" },
            { name: "Diavola", price: "10.00" },
            { name: "Capricciosa", price: "11.50" },
          ].map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[6px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-0.5 mb-[1px] flex-1 border-ink/10 border-b border-dotted" />
                <span className="font-display font-semibold text-[6px] text-primary">
                  {item.price}
                </span>
              </div>
              <div className="mt-0.5 h-[3px] w-12 rounded-full bg-ink/[0.03]" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating menu page — top right */}
      <div className="absolute top-0 -right-3 z-10 h-[142px] w-[100px] rotate-[8deg] rounded-2xl border border-ink/8 bg-white/95 p-3 shadow-ink/[0.06] shadow-lg backdrop-blur-sm">
        <p className="mb-2.5 font-bold font-display text-[9px] text-ink lowercase tracking-tight">
          dolci<span className="text-primary">.</span>
        </p>
        <div className="space-y-2.5">
          {[
            { name: "Tiramisù", price: "7.00" },
            { name: "Panna Cotta", price: "6.50" },
            { name: "Cannolo", price: "5.00" },
          ].map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[6px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-0.5 mb-[1px] flex-1 border-ink/10 border-b border-dotted" />
                <span className="font-display font-semibold text-[6px] text-primary">
                  {item.price}
                </span>
              </div>
              <div className="mt-0.5 h-[3px] w-10 rounded-full bg-ink/[0.03]" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating menu page — bottom left */}
      <div className="absolute bottom-14 -left-4 z-10 h-[136px] w-[96px] rotate-[6deg] rounded-2xl border border-ink/8 bg-white/95 p-3 shadow-ink/[0.06] shadow-lg backdrop-blur-sm">
        <p className="mb-2.5 font-bold font-display text-[9px] text-ink lowercase tracking-tight">
          vini<span className="text-primary">.</span>
        </p>
        <div className="space-y-2.5">
          {[
            { name: "Chianti", price: "6.00" },
            { name: "Barolo", price: "12.00" },
          ].map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[6px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-0.5 mb-[1px] flex-1 border-ink/10 border-b border-dotted" />
                <span className="font-display font-semibold text-[6px] text-primary">
                  {item.price}
                </span>
              </div>
              <div className="mt-0.5 h-[3px] w-14 rounded-full bg-ink/[0.03]" />
            </div>
          ))}
          <div className="h-[3px] w-12 rounded-full bg-ink/[0.03]" />
          <div className="h-[3px] w-8 rounded-full bg-ink/[0.03]" />
        </div>
      </div>

      {/* Floating menu page — bottom right */}
      <div className="absolute -right-2 bottom-12 z-10 h-[140px] w-[100px] rotate-[-7deg] rounded-2xl border border-ink/8 bg-white/95 p-3 shadow-ink/[0.06] shadow-lg backdrop-blur-sm">
        <p className="mb-2.5 font-bold font-display text-[9px] text-ink lowercase tracking-tight">
          antipasti<span className="text-primary">.</span>
        </p>
        <div className="space-y-2.5">
          {[
            { name: "Burrata", price: "14.00" },
            { name: "Tartare", price: "16.00" },
          ].map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[6px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-0.5 mb-[1px] flex-1 border-ink/10 border-b border-dotted" />
                <span className="font-display font-semibold text-[6px] text-primary">
                  {item.price}
                </span>
              </div>
              <div className="mt-0.5 h-[3px] w-11 rounded-full bg-ink/[0.03]" />
            </div>
          ))}
          <div className="h-[3px] w-14 rounded-full bg-ink/[0.03]" />
          <div className="h-[3px] w-9 rounded-full bg-ink/[0.03]" />
        </div>
      </div>

      {/* "No app" badge */}
      <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 shadow-lg">
          <Check className="size-3 text-white" strokeWidth={3} />
          <span className="font-bold text-[11px] text-white leading-none">
            No app, solo scan
          </span>
        </div>
      </div>
    </div>
  );
}

function TranslationsIllustration() {
  return (
    <div className="relative flex h-[380px] w-[280px] items-center justify-center">
      {/* Back card — Japanese */}
      <div className="absolute top-10 left-2 h-[200px] w-[150px] origin-bottom-center rotate-[-8deg] rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[11px]">🇯🇵</span>
          <span className="font-medium text-[9px] text-ink/40">日本語</span>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-16 rounded-full bg-ink/[0.06]" />
          <div className="h-1 w-20 rounded-full bg-ink/[0.04]" />
          <div className="h-1 w-12 rounded-full bg-ink/[0.04]" />
        </div>
      </div>
      {/* Middle card — French */}
      <div className="absolute top-6 right-2 h-[200px] w-[150px] origin-bottom-center rotate-[7deg] rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[11px]">🇫🇷</span>
          <span className="font-medium text-[9px] text-ink/40">Français</span>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-14 rounded-full bg-ink/[0.06]" />
          <div className="h-1 w-20 rounded-full bg-ink/[0.04]" />
          <div className="h-1 w-10 rounded-full bg-ink/[0.04]" />
        </div>
      </div>
      {/* Front card — Italian */}
      <div className="relative z-10 h-[220px] w-[170px] rounded-2xl border border-ink/8 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]">🇮🇹</span>
            <span className="font-bold text-[10px] text-ink">Italiano</span>
          </div>
          <Globe className="size-4 text-primary" />
        </div>
        <div className="space-y-3">
          {[
            { name: "Margherita", desc: "Pomodoro, mozzarella", price: "8.50" },
            {
              name: "Diavola",
              desc: "Salame piccante, peperoni",
              price: "10.00",
            },
            {
              name: "Capricciosa",
              desc: "Prosciutto, funghi, olive",
              price: "11.50",
            },
            {
              name: "Quattro Formaggi",
              desc: "Mozzarella, gorgonzola",
              price: "11.00",
            },
          ].map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[8px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-1 mb-[2px] flex-1 border-ink/15 border-b border-dotted" />
                <span className="font-display font-semibold text-[8px] text-primary">
                  {item.price}
                </span>
              </div>
              <p className="mt-0.5 text-[6.5px] text-ink/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Decorative flags */}
      <span className="absolute -top-3 -right-4 rotate-[10deg] text-[20px] opacity-40">
        🇬🇧
      </span>
      <span className="absolute top-1/2 -right-6 rotate-[-6deg] text-[20px] opacity-40">
        🇩🇪
      </span>
      <span className="absolute top-1/2 -left-6 rotate-[12deg] text-[20px] opacity-40">
        🇪🇸
      </span>
      <span className="absolute -top-3 -left-2 rotate-[-8deg] text-[20px] opacity-40">
        🇨🇳
      </span>
      <span className="absolute -right-5 bottom-12 rotate-[5deg] text-[20px] opacity-40">
        🇧🇷
      </span>
      {/* Language count badge */}
      <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center">
        <div className="flex items-center justify-center rounded-full bg-primary px-6 py-2.5 shadow-lg">
          <span className="font-bold text-[13px] text-white leading-none">
            30+ lingue
          </span>
        </div>
      </div>
    </div>
  );
}

function AvoMascot({
  gradientId,
  clipId,
  maskId,
  filterId0,
  filterId1,
  size = "sm",
}: {
  gradientId: string;
  clipId: string;
  maskId: string;
  filterId0: string;
  filterId1: string;
  size?: "sm" | "lg";
}) {
  const width = size === "lg" ? 18 : 10;
  const height = size === "lg" ? 22 : 12;
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={height}
      viewBox="0 0 20 24"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.48 5.09c.59-1.81 1.53-3.42 3.31-4.31C6.39-.02 8.01-.24 9.75.28c2.1.63 3.61 2.42 4.98 4l1.12 1.39.02.03.01.01c.23.19.68.9.89 1.17 3.25 4.07 4.79 9.41 1.04 13.72-.86.99-2.43 2.11-3.72 2.55-2.6 1.03-5.89 1.2-8.5.11l-.2-.09c-1.75-.77-3.26-2.03-4.15-3.7-.61-1.14-1-2.38-1.15-3.66-.36-2.87.51-7.98 1.4-10.72Z"
        fill={size === "lg" ? `url(#${gradientId})` : "white"}
        fillOpacity={size === "lg" ? undefined : 0.9}
      />
      <g clipPath={`url(#${clipId})`}>
        <mask
          height="4"
          id={maskId}
          maskUnits="userSpaceOnUse"
          style={{ maskType: "alpha" } as React.CSSProperties}
          width="5"
          x="9"
          y="9"
        >
          <path
            d="M11.52 9.31a.08.08 0 0 1 .15 0l.07.2c.1.29.27.56.5.78.22.22.49.39.79.5l.22.08a.08.08 0 0 1 0 .15l-.22.08c-.3.1-.56.27-.78.48-.22.21-.39.47-.5.75l-.09.23a.08.08 0 0 1-.15 0l-.09-.24c-.11-.28-.28-.53-.5-.74a2.1 2.1 0 0 0-.77-.48l-.23-.08a.08.08 0 0 1 0-.15l.23-.08c.29-.1.55-.27.77-.48.22-.21.38-.46.49-.74l.09-.24Z"
            fill="#3186FF"
          />
        </mask>
        <g mask={`url(#${maskId})`}>
          <g filter={`url(#${filterId0})`}>
            <ellipse cx="11.77" cy="10.93" fill="black" rx="2.28" ry="1.79" />
          </g>
          {size === "lg" && (
            <>
              <g filter={`url(#${filterId1})`}>
                <circle cx="10.27" cy="10.86" fill="black" r="0.8" />
              </g>
              <g filter={`url(#${filterId1})`}>
                <circle cx="10.11" cy="10.93" fill="black" r="0.8" />
              </g>
              <g filter={`url(#${filterId1})`}>
                <path
                  d="M12.13 9.37c-.26.81-1.49 1.4-1.99 1.4l1.41-2.26.58.86Z"
                  fill="black"
                />
              </g>
              <g filter={`url(#${filterId1})`}>
                <path
                  d="M12.09 9.11c-.26.81-1.49 1.4-1.99 1.4l1.41-2.26.58.86Z"
                  fill="black"
                />
              </g>
              <g filter={`url(#${filterId1})`}>
                <path
                  d="M12.14 12.4c-.26-.81-1.49-1.4-1.99-1.4l1.41 2.26.58-.86Z"
                  fill="black"
                />
              </g>
              <g filter={`url(#${filterId1})`}>
                <path
                  d="M12.16 12.87c-.26-.81-1.49-1.4-1.99-1.4l1.41 2.26.58-.86Z"
                  fill="black"
                />
              </g>
            </>
          )}
        </g>
      </g>
      <path
        d="M12.8 14.56a.78.78 0 0 1 .78-.77.78.78 0 0 1 .78.78v.04a3.56 3.56 0 0 1-.43 1.54 4.16 4.16 0 0 1-3.01 2.08 4.16 4.16 0 0 1-3.71-1.56 3.47 3.47 0 0 1-.41-.76 1.87 1.87 0 0 1-.1-.29l-.01-.03a.78.78 0 0 1 1.4-.67l.02.04.06.1c.06.1.14.22.26.35a2.56 2.56 0 0 0 3.38.34c.58-.42.83-.94.95-1.28.04-.1.06-.19.07-.24a.67.67 0 0 0 .01-.05v-.01Z"
        fill="black"
        fillOpacity={size === "lg" ? undefined : 0.5}
      />
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          id={filterId0}
        >
          <feFlood floodOpacity="0" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" result="shape" />
          <feGaussianBlur result="blur" stdDeviation="0.56" />
        </filter>
        {size === "lg" && (
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            id={filterId1}
          >
            <feFlood floodOpacity="0" result="bg" />
            <feBlend in="SourceGraphic" in2="bg" result="shape" />
            <feGaussianBlur result="blur" stdDeviation="0.99" />
          </filter>
        )}
        {size === "lg" && (
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={gradientId}
            x1="5.41"
            x2="13.77"
            y1="-0.01"
            y2="23.23"
          >
            <stop stopColor="white" />
            <stop offset="0.72" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0.6" />
          </linearGradient>
        )}
        <clipPath id={clipId}>
          <rect
            fill="white"
            height="3.36"
            transform="translate(9.88 9.25)"
            width="3.44"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

function AiChatIllustration() {
  return (
    <div className="relative flex h-[380px] w-[280px] items-center justify-center">
      <div className="relative w-[230px] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-ink/6 border-b px-4 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <AvoMascot
              clipId="avo-h-clip"
              filterId0="avo-h-f0"
              filterId1="avo-h-f1"
              gradientId="avo-h-grad"
              maskId="avo-h-mask"
              size="lg"
            />
          </div>
          <div>
            <span className="block font-bold font-display text-[10px] text-ink">
              AVO
            </span>
            <span className="text-[7px] text-ink/40">
              Il tuo assistente di fiducia
            </span>
          </div>
        </div>
        {/* Messages */}
        <div className="space-y-2.5 p-3">
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3 py-2">
              <span className="block text-[8px] text-white leading-relaxed">
                La burrata contiene lattosio?
              </span>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary">
              <AvoMascot
                clipId="avo-m1-clip"
                filterId0="avo-m1-f0"
                filterId1="avo-m1-f1"
                gradientId="avo-m1-grad"
                maskId="avo-m1-mask"
              />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-primary/[0.06] px-3 py-2">
              <span className="block text-[8px] text-ink leading-relaxed">
                Sì, la Burrata Pugliese contiene{" "}
                <span className="font-semibold text-primary">latticini</span>.
                Ti consiglio il Carpaccio di Polpo! 🐙
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3 py-2">
              <span className="block text-[8px] text-white leading-relaxed">
                Perfetto, e un vino?
              </span>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary">
              <AvoMascot
                clipId="avo-m2-clip"
                filterId0="avo-m2-f0"
                filterId1="avo-m2-f1"
                gradientId="avo-m2-grad"
                maskId="avo-m2-mask"
              />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-primary/[0.06] px-3 py-2">
              <span className="block text-[8px] text-ink leading-relaxed">
                Un Vermentino si abbina perfettamente! Fresco e minerale. 🍷
              </span>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-ink/8 px-3 py-2">
            <span className="flex-1 text-[7px] text-ink/25">
              Chiedimi qualcosa...
            </span>
            <div className="flex size-5 items-center justify-center rounded-full bg-primary">
              <ArrowRight className="size-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* Sparkles badge */}
      <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1 rounded-full border border-primary/10 bg-secondary px-2.5 py-1 shadow-sm">
        <Sparkles className="size-3 text-primary" />
        <span className="font-bold text-[7px] text-primary">AI</span>
      </div>
      {/* Language flags */}
      <div className="absolute -bottom-5 -left-6 z-20">
        <div className="flex items-center gap-2 rounded-full border border-ink/6 bg-white px-3.5 py-1.5 shadow-md">
          <span className="text-[16px]">🇬🇧</span>
          <span className="text-[16px]">🇫🇷</span>
          <span className="text-[16px]">🇩🇪</span>
        </div>
      </div>
    </div>
  );
}

function AllergensIllustration() {
  return (
    <div className="relative flex h-[380px] w-[280px] items-center justify-center">
      {/* Menu card */}
      <div className="relative w-[200px] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xl">
        <div className="flex items-center justify-between border-ink/6 border-b px-4 py-3">
          <span className="font-bold font-display text-[10px] text-ink lowercase">
            antipasti<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5">
            <ShieldCheck className="size-2.5 text-primary" />
            <span className="font-semibold text-[7px] text-primary">
              Allergeni
            </span>
          </div>
        </div>
        <div className="space-y-3 p-3">
          {(
            [
              {
                name: "Burrata Pugliese",
                desc: "Datterini, basilico, olio EVO",
                price: "14.00",
                allergens: [MilkBottleIcon],
              },
              {
                name: "Tartare di Tonno",
                desc: "Avocado, sesamo, salsa di soia",
                price: "16.00",
                allergens: [FishFoodIcon, BeanIcon],
              },
              {
                name: "Carpaccio di Polpo",
                desc: "Patate tiepide, olive taggiasche",
                price: "13.00",
                allergens: [ShellfishIcon],
              },
              {
                name: "Vitello Tonnato",
                desc: "Salsa tonnata della tradizione",
                price: "12.00",
                allergens: [FishFoodIcon, EggIcon],
              },
            ] as const
          ).map((item) => (
            <div key={item.name}>
              <div className="flex items-baseline">
                <span className="font-display font-semibold text-[8px] text-ink uppercase">
                  {item.name}
                </span>
                <span className="mx-1 mb-[2px] flex-1 border-ink/15 border-b border-dotted" />
                <span className="font-display font-semibold text-[8px] text-primary">
                  {item.price}
                </span>
              </div>
              <p className="mt-0.5 text-[6.5px] text-ink/40">{item.desc}</p>
              <div className="mt-1 flex items-center gap-0.5">
                {item.allergens.map((icon, i) => (
                  <span
                    className="inline-flex size-3.5 items-center justify-center rounded-full bg-[#B1693A]"
                    key={i}
                  >
                    <HugeiconsIcon className="size-2 text-white" icon={icon} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Floating allergen badges */}
      {[
        {
          icon: MilkBottleIcon,
          label: "Latte",
          top: "-8px",
          left: "-20px",
          rotate: "-6deg",
        },
        {
          icon: FishFoodIcon,
          label: "Pesce",
          top: "60px",
          right: "-36px",
          rotate: "5deg",
        },
        {
          icon: EggIcon,
          label: "Uova",
          top: "170px",
          left: "-32px",
          rotate: "8deg",
        },
        {
          icon: BeanIcon,
          label: "Soia",
          bottom: "-8px",
          right: "20px",
          rotate: "-4deg",
        },
        {
          icon: ShellfishIcon,
          label: "Molluschi",
          bottom: "-12px",
          left: "30px",
          rotate: "6deg",
        },
        {
          icon: WheatIcon,
          label: "Glutine",
          top: "-12px",
          right: "-10px",
          rotate: "-3deg",
        },
        {
          icon: NutIcon,
          label: "Noci",
          bottom: "70px",
          right: "-34px",
          rotate: "10deg",
        },
      ].map((a) => (
        <div
          className="absolute z-20 flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1.5 shadow-md"
          key={a.label}
          style={{
            top: a.top,
            bottom: a.bottom,
            left: a.left,
            right: a.right,
            transform: `rotate(${a.rotate})`,
          }}
        >
          <span className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary">
            <HugeiconsIcon className="size-2.5 text-white" icon={a.icon} />
          </span>
          <span className="font-semibold text-[7px] text-primary">
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}
