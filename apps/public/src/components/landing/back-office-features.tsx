"use client";

import {
  BotMessageSquare,
  Languages,
  LayoutDashboard,
  Palette,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FadeIn } from "@/components/landing/fade-in";
import { cn } from "@/lib/utils";

const CYCLE_DURATION = 4000; // ms per tab

const backofficeFeatures = [
  {
    id: "menu",
    icon: LayoutDashboard,
    title: "Gestione menu",
    description:
      "Aggiungi, modifica e riordina piatti e categorie in pochi clic. Tutto in tempo reale.",
  },
  {
    id: "ai",
    icon: BotMessageSquare,
    title: "Assistente AI",
    description:
      "Modifica il menu con comandi in linguaggio naturale. L'AI fa il lavoro pesante.",
  },
  {
    id: "style",
    icon: Palette,
    title: "Personalizzazione",
    description:
      "Colori, font e logo del tuo brand. Il menu digitale che sembra fatto su misura.",
  },
  {
    id: "translate",
    icon: Languages,
    title: "Traduzioni automatiche",
    description:
      "Oltre 30 lingue disponibili. Traduci tutto il menu con un solo clic.",
  },
];

export function BackOfficeFeatures() {
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
      progressRef.current += (tick / CYCLE_DURATION) * 100;
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % backofficeFeatures.length);
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
      id="back-office"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        <FadeIn>
          <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
            <h2 className="font-bold font-display text-[clamp(1.6rem,3vw,2.5rem)] text-ink leading-tight tracking-tight">
              Tutto il tuo menu, <br className="hidden md:block" />
              in un unico pannello
            </h2>
            <p className="max-w-sm text-base text-ink/50 leading-relaxed sm:ml-auto">
              Gestisci piatti, traduzioni, stile e assistente AI da un back
              office pensato per la ristorazione. Semplice, veloce, sempre
              aggiornato.
            </p>
          </div>
        </FadeIn>

        {/* Screenshot area */}
        <FadeIn delay={100}>
          <div className="px-3 pt-3 md:-mx-8">
            <div className="mask-b-from-75% mask-b-to-95% relative aspect-76/36">
              {backofficeFeatures.map((f, i) => (
                <Image
                  alt={`Avo back office — ${f.title}`}
                  className={cn(
                    "object-contain transition-opacity duration-500",
                    i === activeIndex ? "opacity-100" : "opacity-0"
                  )}
                  fill
                  key={f.id}
                  priority={i === 0}
                  sizes="(min-width: 1024px) 960px, 100vw"
                  src={`/images/backoffice-${f.id}.png`}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Feature tabs with progress bars */}
        <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
          {backofficeFeatures.map((feature, i) => (
            <FadeIn delay={i * 80} key={feature.id}>
              <button
                className="relative w-full pt-4 text-left"
                onClick={() => selectTab(i)}
                onMouseEnter={() => i === activeIndex && setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                type="button"
              >
                <div className="absolute top-0 right-0 left-0 h-[2px] overflow-hidden rounded-full bg-ink/[0.08]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: i === activeIndex ? `${progress}%` : "0%",
                      transition: "none",
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <feature.icon
                      className={cn(
                        "size-4",
                        i === activeIndex ? "text-primary" : "text-ink/30"
                      )}
                    />
                    <h3
                      className={cn(
                        "font-medium text-sm",
                        i === activeIndex ? "text-ink" : "text-ink/50"
                      )}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-ink/50 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
