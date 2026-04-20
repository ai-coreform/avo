"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@avo/ui/components/ui/avatar";
import { Button } from "@avo/ui/components/ui/button";
import {
  ArrowRight,
  Camera,
  Check,
  Mail,
  Menu,
  Radio,
  Sparkles,
  Star,
  Wand2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackOfficeFeatures } from "@/components/landing/back-office-features";
import { ClientFeatures } from "@/components/landing/client-features";
import { FadeIn } from "@/components/landing/fade-in";
import { FaqAccordionItem } from "@/components/landing/faq-accordion-item";
import { HeroPhoneMockup } from "@/components/landing/mockups/hero-phone";
import { useCountdown } from "@/components/landing/use-countdown";
import { cn } from "@/lib/utils";

const SITE_URL = "https://avomenu.com";
const TRIAL_URL = "/prova-gratis";
const PROMO_END_DATE = new Date("2026-04-15T23:59:59");

const MORPH_IN = "icon-morph-in 300ms cubic-bezier(0.23,1,0.32,1) forwards";
const MORPH_OUT = "icon-morph-out 250ms cubic-bezier(0.23,1,0.32,1) forwards";

function menuIconAnimation(nav: boolean, visible: boolean): string {
  if (!nav) {
    return "none";
  }
  return visible ? MORPH_OUT : MORPH_IN;
}

function xIconAnimation(nav: boolean, visible: boolean): string {
  if (!nav) {
    return "none";
  }
  return visible ? MORPH_IN : MORPH_OUT;
}

function qrCellStyle(k: number): { backgroundColor: string; opacity: number } {
  const isFixed =
    k < 3 ||
    (k >= 5 && k < 7) ||
    k === 10 ||
    k === 12 ||
    k === 14 ||
    (k >= 18 && k < 20) ||
    k >= 22;
  if (isFixed) {
    return { backgroundColor: "var(--primary)", opacity: 1 };
  }
  if (k % 3 === 0) {
    return { backgroundColor: "rgba(0,0,0,0.06)", opacity: 1 };
  }
  return { backgroundColor: "var(--primary)", opacity: 0.6 };
}

const siteUrl = SITE_URL;
const socialImageUrl = `${SITE_URL}/images/header-image.png`;

const faqItems = [
  {
    question: "Che cos'e Avo?",
    answer:
      "Avo e un software che permette a ristoranti e locali di creare, gestire e pubblicare il proprio menu digitale. I clienti lo consultano tramite QR code, senza scaricare nessuna app.",
  },
  {
    question: "In che modo Avo usa l'intelligenza artificiale?",
    answer:
      "Avo usa l'AI per tradurre il menu in tutte le lingue in automatico, generare descrizioni dei piatti, tracciare gli allergeni e offrirti un assistente con cui modificare e consultare il menu, e molto altro. Tu controlli sempre il risultato finale, l'AI fa il lavoro pesante.",
  },
  {
    question: "Posso aggiornare il menu in tempo reale?",
    answer:
      "Si, ogni modifica e visibile subito. Se finisce un piatto, cambia un prezzo o parte una promo del giorno, aggiorni dal pannello e il menu del cliente si aggiorna all'istante.",
  },
  {
    question: "Come funzionano le traduzioni?",
    answer:
      "Avo traduce automaticamente il menu nelle lingue che scegli. I tuoi clienti internazionali vedono il menu nella loro lingua, senza che tu debba tradurre nulla a mano.",
  },
  {
    question: "Quanto costa Avo?",
    answer:
      "Puoi provarlo gratis, senza carta di credito. Dopo la prova ci sono piani flessibili pensati per ogni tipo di locale, dal ristorante singolo alla catena con piu sedi.",
  },
  {
    question: "Funziona anche per cocktail bar o enoteche?",
    answer:
      "Assolutamente. Avo funziona per qualsiasi locale con un menu: ristoranti, pizzerie, cocktail bar, enoteche, pasticcerie, food truck. Se hai una lista di cose da offrire, Avo la rende digitale.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Avo",
    url: siteUrl,
    logo: `${siteUrl}/images/avo-logo.svg`,
    image: socialImageUrl,
    email: "team@avomenu.com",
    sameAs: [siteUrl],
    description:
      "Avo aiuta i ristoranti a pubblicare menu digitali con QR code, traduzioni e gestione semplice dal back office.",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Avo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    image: socialImageUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Ristoranti e locali hospitality",
    },
    description:
      "Software per ristoranti che gestisce menu digitali, QR code, traduzioni automatiche e aggiornamenti dal back office.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Avo",
    url: siteUrl,
    inLanguage: "it-IT",
    description:
      "Sito ufficiale di Avo, piattaforma per creare e gestire menu digitali per ristoranti.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const countdown = useCountdown(PROMO_END_DATE);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const openMobileNav = useCallback(() => {
    setMobileNav(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setMobileNavVisible(true))
    );
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavVisible(false);
    const el = mobileNavRef.current;
    if (!el) {
      setMobileNav(false);
      return;
    }
    const onEnd = () => {
      setMobileNav(false);
      el.removeEventListener("transitionend", onEnd);
    };
    el.addEventListener("transitionend", onEnd);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="min-h-svh overflow-x-hidden bg-white text-ink">
        {/* ── Promo Banner ── */}
        {showBanner && (
          <div className="fixed inset-x-0 top-0 z-50 bg-secondary">
            <div className="relative mx-auto flex h-10 max-w-7xl items-center justify-between px-4 md:justify-center md:px-6">
              <Link
                className="truncate font-semibold text-[12px] text-primary tracking-wide md:text-[13px]"
                href={TRIAL_URL}
              >
                <span className="md:hidden">
                  🔥 -30% OFF <span className="mx-1 text-primary/30">|</span>{" "}
                  {countdown.days}g{" "}
                  <span className="countdown-colon font-bold">:</span>{" "}
                  {String(countdown.hours).padStart(2, "0")}h{" "}
                  <span className="countdown-colon font-bold">:</span>{" "}
                  {String(countdown.minutes).padStart(2, "0")}m{" "}
                  <span className="mx-1 text-primary/30">|</span>{" "}
                  <span className="inline-flex items-center gap-1 underline underline-offset-2">
                    Registrati <ArrowRight className="size-2.5" />
                  </span>
                </span>
                <span className="hidden md:inline-flex md:items-center md:gap-0">
                  🔥 PROMO -30% OFF{" "}
                  <span className="mx-1.5 text-primary/30">|</span> Scade tra{" "}
                  {countdown.days}g{" "}
                  <span className="countdown-colon font-bold">:</span>{" "}
                  {String(countdown.hours).padStart(2, "0")}h{" "}
                  <span className="countdown-colon font-bold">:</span>{" "}
                  {String(countdown.minutes).padStart(2, "0")}m{" "}
                  <span className="mx-1.5 text-primary/30">|</span>{" "}
                  <span className="inline-flex items-center gap-1 underline underline-offset-2">
                    Registrati ora <ArrowRight className="size-3" />
                  </span>
                </span>
              </Link>
              <button
                aria-label="Chiudi banner"
                className="flex size-6 shrink-0 items-center justify-center text-primary/50 transition-colors hover:text-primary md:absolute md:right-6"
                onClick={() => setShowBanner(false)}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav
          className={cn(
            "fixed inset-x-0 z-50 transition-all duration-300",
            showBanner ? "top-10" : "top-0",
            scrolled
              ? "border-ink/6 border-b bg-white/80 backdrop-blur-xl"
              : "bg-transparent"
          )}
        >
          <div className="mx-auto flex h-[72px] max-w-7xl items-center px-6 lg:px-10">
            <Link className="flex shrink-0 items-center" href="/">
              <Image
                alt="Avo"
                className="h-8 w-auto"
                height={32}
                priority
                src="/images/avo-logo.svg"
                width={80}
              />
            </Link>

            <div className="ml-10 hidden items-center gap-1 md:flex">
              <a
                className="px-4 py-2 text-[15px] text-ink/70 transition-colors hover:text-ink"
                href="#come-funziona"
              >
                Come funziona
              </a>
              <a
                className="px-4 py-2 text-[15px] text-ink/70 transition-colors hover:text-ink"
                href="#back-office"
              >
                Back office
              </a>
              <a
                className="px-4 py-2 text-[15px] text-ink/70 transition-colors hover:text-ink"
                href="#prodotto"
              >
                Lato cliente
              </a>
              <a
                className="px-4 py-2 text-[15px] text-ink/70 transition-colors hover:text-ink"
                href="#contatti"
              >
                Contattaci
              </a>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <Link
                className="hidden h-10 items-center justify-center rounded-full px-6 font-display font-semibold text-[14px] text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink md:inline-flex"
                href="/login"
              >
                Accedi
              </Link>
              <Button
                asChild
                className="hidden h-10 rounded-full px-6 font-display font-semibold text-[14px] md:inline-flex"
                size="sm"
              >
                <Link href={TRIAL_URL}>Provalo gratis</Link>
              </Button>
              <button
                aria-label="Menu"
                className="relative flex size-9 items-center justify-center md:hidden"
                onClick={() => (mobileNav ? closeMobileNav() : openMobileNav())}
                type="button"
              >
                <Menu
                  className="absolute size-5 text-ink/60"
                  style={{
                    animation: menuIconAnimation(mobileNav, mobileNavVisible),
                    opacity: mobileNav ? undefined : 1,
                  }}
                />
                <X
                  className="absolute size-5 text-ink/60"
                  style={{
                    animation: xIconAnimation(mobileNav, mobileNavVisible),
                    opacity: mobileNav ? undefined : 0,
                  }}
                />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile nav overlay */}
        {mobileNav && (
          <div
            className={`fixed inset-0 z-40 bg-white transition-opacity duration-300 ease-out md:hidden ${
              mobileNavVisible ? "opacity-100" : "opacity-0"
            }`}
            ref={mobileNavRef}
          >
            <div
              className="px-6"
              style={{
                paddingTop: showBanner
                  ? "calc(72px + 2.5rem + 1rem)"
                  : "calc(72px + 1rem)",
              }}
            >
              {[
                { href: "#come-funziona", label: "Come funziona" },
                { href: "#back-office", label: "Back office" },
                { href: "#prodotto", label: "Lato cliente" },
                { href: "#contatti", label: "Contattaci" },
              ].map((item, i) => (
                <a
                  className="block py-4 font-display font-semibold text-2xl text-ink tracking-tight transition-all duration-300 ease-out"
                  href={item.href}
                  key={item.href}
                  onClick={closeMobileNav}
                  style={{
                    transitionDelay: mobileNavVisible
                      ? `${(i + 1) * 50}ms`
                      : "0ms",
                    opacity: mobileNavVisible ? 1 : 0,
                    transform: mobileNavVisible
                      ? "translateY(0)"
                      : "translateY(8px)",
                  }}
                >
                  {item.label}
                </a>
              ))}
              <Link
                className="block py-4 font-display font-semibold text-2xl text-ink tracking-tight transition-all duration-300 ease-out"
                href="/login"
                onClick={closeMobileNav}
                style={{
                  transitionDelay: mobileNavVisible ? "250ms" : "0ms",
                  opacity: mobileNavVisible ? 1 : 0,
                  transform: mobileNavVisible
                    ? "translateY(0)"
                    : "translateY(8px)",
                }}
              >
                Accedi
              </Link>
            </div>
          </div>
        )}

        <main>
          {/* ── Hero ── */}
          <section
            className={cn(
              "overflow-hidden pb-10 md:pb-16",
              showBanner ? "pt-[8.5rem] md:pt-[9.5rem]" : "pt-28 md:pt-32"
            )}
          >
            <div className="mx-auto max-w-5xl px-6">
              <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr] lg:gap-16">
                <div className="max-w-xl">
                  <FadeIn>
                    <span className="inline-block rounded-full bg-secondary px-4 py-1.5 font-semibold text-[13px] text-primary uppercase tracking-[0.15em]">
                      Scopri Avo
                    </span>
                  </FadeIn>

                  <FadeIn delay={60}>
                    <h1 className="mt-5 font-display font-extrabold text-[clamp(2.5rem,5.5vw,4.2rem)] text-ink leading-[1.08] tracking-tight">
                      Il menu bello da vedere, facile da gestire.
                    </h1>
                  </FadeIn>

                  <FadeIn delay={120}>
                    <p className="mt-6 max-w-[420px] text-[17px] text-ink/45 leading-relaxed">
                      Menu digitale con QR code, traduzioni automatiche,
                      allergeni e assistente AI. Online in 5 minuti.
                    </p>
                  </FadeIn>

                  <FadeIn delay={180}>
                    <div className="mt-10">
                      <Button
                        asChild
                        className="h-[52px] rounded-full px-8 font-display font-semibold text-[15px]"
                        size="lg"
                      >
                        <Link href={TRIAL_URL}>
                          Provalo gratis
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </FadeIn>

                  <FadeIn delay={240}>
                    <div className="mt-6 flex items-center gap-2">
                      <Star className="size-4 fill-ink text-ink" />
                      <span className="text-[14px] text-ink/50">
                        Scelto da più di 100 ristoranti.
                      </span>
                    </div>
                  </FadeIn>
                </div>

                <FadeIn className="hidden justify-center md:flex" delay={200}>
                  <div className="relative px-10 py-8">
                    <div
                      className="absolute inset-0 rounded-[28px]"
                      style={{ backgroundColor: "var(--secondary)" }}
                    />
                    <div className="relative z-10">
                      <HeroPhoneMockup />
                    </div>
                  </div>
                </FadeIn>
              </div>

              <FadeIn
                autoShow
                className="mt-12 flex justify-center md:hidden"
                delay={300}
              >
                <div className="relative px-8 py-6">
                  <div
                    className="absolute inset-0 rounded-[24px]"
                    style={{ backgroundColor: "var(--secondary)" }}
                  />
                  <div className="relative z-10">
                    <HeroPhoneMockup />
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── Testimonials ── */}
          <section>
            <div className="py-14 md:py-20">
              <div className="mx-auto w-full max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                  {[
                    {
                      name: "Salvatore Cataldo",
                      role: "Ristoratore",
                      stars: 5,
                      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                      content:
                        "Da quando usiamo Avo, i clienti stranieri ordinano senza problemi. Le traduzioni automatiche sono impeccabili.",
                    },
                    {
                      name: "Antonella Tarantino",
                      role: "Chef",
                      stars: 5,
                      avatar:
                        "https://randomuser.me/api/portraits/women/44.jpg",
                      content:
                        "Aggiornare il menu è diventato semplicissimo. Cambio i piatti del giorno in pochi secondi, anche dal telefono.",
                    },
                    {
                      name: "Davide Ferrante",
                      role: "Ristoratore",
                      stars: 5,
                      avatar: "https://randomuser.me/api/portraits/men/74.jpg",
                      content:
                        "L'assistente AI risponde alle domande sugli allergeni al posto nostro. I clienti lo adorano.",
                    },
                  ].map((testimonial, index) => (
                    <FadeIn delay={index * 100} key={testimonial.name}>
                      <div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              className={cn(
                                "size-4",
                                i < testimonial.stars
                                  ? "fill-primary stroke-primary"
                                  : "fill-foreground/15 stroke-transparent"
                              )}
                              key={i}
                            />
                          ))}
                        </div>
                        <p className="my-4 text-foreground">
                          {testimonial.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 border border-transparent shadow ring-1 ring-foreground/10">
                            <AvatarImage
                              alt={testimonial.name}
                              src={testimonial.avatar}
                            />
                            <AvatarFallback>
                              {testimonial.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-foreground text-sm">
                            {testimonial.name}
                          </div>
                          <span
                            aria-hidden
                            className="size-1 rounded-full bg-foreground/25"
                          />
                          <span className="text-muted-foreground text-sm">
                            {testimonial.role}
                          </span>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section className="scroll-mt-20 py-14 md:py-20" id="come-funziona">
            <div className="mx-auto max-w-5xl px-6">
              <FadeIn>
                <div className="mx-auto max-w-2xl text-center">
                  <span className="mb-3 block font-medium text-primary text-sm">
                    Come funziona
                  </span>
                  <h2 className="font-bold font-display text-[clamp(1.6rem,3vw,2.5rem)] text-ink tracking-tight">
                    Dal cartaceo al digitale in 5 minuti
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-base text-ink/50">
                    Tre semplici passaggi per trasformare il tuo menu cartaceo
                    in un&apos;esperienza digitale completa per i tuoi clienti.
                  </p>
                </div>
              </FadeIn>

              <div className="mt-12 grid gap-12 md:mt-14 md:grid-cols-3 md:gap-8">
                {/* Step 1 */}
                <FadeIn delay={0}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8 flex h-[180px] w-full items-center justify-center">
                      <div className="absolute top-0 right-4 flex size-8 items-center justify-center rounded-full bg-ink/[0.08] md:right-8">
                        <span className="font-bold text-ink/50 text-sm">1</span>
                      </div>
                      <div className="relative">
                        <div className="h-[130px] w-[100px] -rotate-6 rounded-lg border border-ink/8 bg-white p-3 shadow-lg">
                          <div className="mb-2 h-2 w-14 rounded bg-ink/10" />
                          <div className="space-y-1.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div
                                className="flex items-center justify-between"
                                key={n}
                              >
                                <div
                                  className="h-1.5 rounded bg-ink/[0.06]"
                                  style={{ width: `${40 + n * 6}%` }}
                                />
                                <div className="h-1.5 w-4 rounded bg-ink/[0.06]" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="absolute -right-6 -bottom-2 flex size-12 rotate-6 items-center justify-center rounded-xl bg-primary shadow-md">
                          <Camera
                            className="size-5 text-white"
                            strokeWidth={1.8}
                          />
                        </div>
                        <div className="absolute -top-2 -left-3 flex size-6 items-center justify-center rounded-full bg-secondary">
                          <Sparkles className="size-3 text-primary" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold font-display text-ink text-lg">
                      Scatta e carica
                    </h3>
                    <p className="mt-2 max-w-[280px] text-ink/50 text-sm leading-relaxed">
                      Scatta una foto al menu cartaceo o carica un PDF.
                      L&apos;AI riconosce piatti, prezzi e descrizioni in pochi
                      secondi.
                    </p>
                  </div>
                </FadeIn>

                {/* Step 2 */}
                <FadeIn delay={100}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8 flex h-[180px] w-full items-center justify-center">
                      <div className="absolute top-0 right-4 flex size-8 items-center justify-center rounded-full bg-ink/[0.08] md:right-8">
                        <span className="font-bold text-ink/50 text-sm">2</span>
                      </div>
                      <div className="relative">
                        <div className="absolute -top-1 -left-3 h-[110px] w-[90px] rotate-[-8deg] rounded-lg border border-ink/6 bg-white shadow" />
                        <div className="absolute -top-1 -right-3 h-[110px] w-[90px] rotate-[8deg] rounded-lg border border-ink/6 bg-white shadow" />
                        <div className="relative z-10 h-[120px] w-[100px] rounded-lg border border-ink/8 bg-white p-3 shadow-lg">
                          <div className="mb-3 flex gap-1.5">
                            <div className="size-5 rounded-md bg-[#294028]" />
                            <div className="size-5 rounded-md bg-[#E8E4D9]" />
                            <div className="size-5 rounded-md border border-ink/10 bg-[#FAF9F6]" />
                          </div>
                          <div className="mb-1.5 h-1.5 w-12 rounded bg-ink/10" />
                          <div className="mb-1 h-1 w-16 rounded bg-ink/[0.06]" />
                          <div className="mb-3 h-1 w-10 rounded bg-ink/[0.06]" />
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-6 rounded-full bg-primary" />
                            <div className="h-1 w-8 rounded bg-ink/[0.06]" />
                          </div>
                        </div>
                        <div className="absolute -right-5 -bottom-2 z-20 flex size-10 rotate-12 items-center justify-center rounded-xl bg-secondary">
                          <Wand2
                            className="size-4 text-primary"
                            strokeWidth={1.8}
                          />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold font-display text-ink text-lg">
                      Personalizza
                    </h3>
                    <p className="mt-2 max-w-[280px] text-ink/50 text-sm leading-relaxed">
                      Scegli colori, font e layout che rispecchiano il tuo
                      ristorante. Aggiungi traduzioni automatiche e assistente
                      AI.
                    </p>
                  </div>
                </FadeIn>

                {/* Step 3 */}
                <FadeIn delay={200}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8 flex h-[180px] w-full items-center justify-center">
                      <div className="absolute top-0 right-4 flex size-8 items-center justify-center rounded-full bg-ink/[0.08] md:right-8">
                        <span className="font-bold text-ink/50 text-sm">3</span>
                      </div>
                      <div className="relative">
                        <div className="flex h-[120px] w-[100px] flex-col items-center justify-center rounded-lg border border-ink/8 bg-white p-3 shadow-lg">
                          <div className="mb-2 grid size-14 grid-cols-5 grid-rows-5 gap-[2px]">
                            {Array.from({ length: 25 }).map((_, k) => {
                              const cell = qrCellStyle(k);
                              return (
                                <div
                                  className="rounded-[1px]"
                                  key={k}
                                  style={cell}
                                />
                              );
                            })}
                          </div>
                          <div className="h-1 w-12 rounded bg-ink/[0.06]" />
                        </div>
                        <div className="absolute -top-3 -right-5 flex size-10 items-center justify-center rounded-xl bg-primary shadow-md">
                          <Radio
                            className="size-4 text-white"
                            strokeWidth={1.8}
                          />
                        </div>
                        <div className="absolute -bottom-1 -left-4 flex size-7 items-center justify-center rounded-full bg-green-500 shadow-sm">
                          <Check
                            className="size-3.5 text-white"
                            strokeWidth={2.5}
                          />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold font-display text-ink text-lg">
                      Vai live
                    </h3>
                    <p className="mt-2 max-w-[280px] text-ink/50 text-sm leading-relaxed">
                      Stampa il QR code, mettilo sui tavoli. Il tuo menu
                      digitale è online, tradotto e sempre aggiornato.
                    </p>
                  </div>
                </FadeIn>
              </div>

              <FadeIn delay={300}>
                <div className="mt-16 flex justify-center">
                  <Button
                    asChild
                    className="h-10 rounded-full px-6 font-display font-semibold text-[14px] shadow-none"
                    size="sm"
                  >
                    <Link href={TRIAL_URL}>
                      Provalo gratis
                      <ArrowRight className="ml-2 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </section>

          <BackOfficeFeatures />
          <ClientFeatures />

          {/* ── CTA / Contact ── */}
          <section className="scroll-mt-20 py-14 md:py-20" id="contatti">
            <FadeIn>
              <div className="mx-auto max-w-5xl px-6">
                <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 md:px-16 md:py-16">
                  <div className="absolute -top-24 -right-24 size-64 rounded-full bg-secondary/10 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-secondary/8 blur-2xl" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <h2 className="max-w-lg font-bold font-display text-[clamp(1.6rem,3.5vw,2.75rem)] text-primary-foreground tracking-tight">
                      Pronto a trasformare il tuo menu?
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-base text-primary-foreground/50 leading-relaxed">
                      Gratis, senza carta di credito. In cinque minuti il tuo
                      menu è online e pronto a stupire.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                      <Button
                        asChild
                        className="h-12 rounded-full px-8 font-display font-semibold text-[15px]"
                        size="lg"
                        variant="secondary"
                      >
                        <Link href={TRIAL_URL}>
                          Inizia gratis
                          <ArrowRight className="ml-1.5 size-4" />
                        </Link>
                      </Button>
                      <a
                        className="inline-flex h-12 items-center gap-2 rounded-full px-8 font-display font-semibold text-[15px] text-primary-foreground/60 transition-colors hover:bg-primary-foreground/5 hover:text-primary-foreground"
                        href="mailto:team@avomenu.com"
                      >
                        <Mail className="size-4" />
                        Contattaci
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-title" className="py-14 md:py-20">
            <div className="mx-auto max-w-3xl px-6">
              <FadeIn>
                <div className="mx-auto max-w-2xl text-center">
                  <span className="mb-3 block font-medium text-primary text-sm">
                    FAQ
                  </span>
                  <h2
                    className="font-bold font-display text-[clamp(1.6rem,3vw,2.5rem)] text-ink tracking-tight"
                    id="faq-title"
                  >
                    Hai qualche dubbio?
                  </h2>
                  <p className="mt-4 text-base text-ink/50 leading-relaxed">
                    Le domande che ci fanno piu spesso, con risposte brevi e
                    dirette.
                  </p>
                </div>
              </FadeIn>

              <div className="mt-12 divide-y divide-ink/8">
                {faqItems.map((item, index) => (
                  <FadeIn delay={index * 50} key={item.question}>
                    <FaqAccordionItem
                      answer={item.answer}
                      question={item.question}
                    />
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="bg-primary pt-16 pb-8">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div>
                <Image
                  alt="Avo"
                  className="h-7 w-auto"
                  height={28}
                  src="/images/avo-logo-dark.svg"
                  width={70}
                />
                <p className="mt-4 max-w-[240px] text-primary-foreground/40 text-sm leading-relaxed">
                  Il menu digitale per la ristorazione italiana. Bello,
                  tradotto, intelligente.
                </p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-primary-foreground/70 text-sm">
                  Prodotto
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Menu digitale",
                    "Traduzioni",
                    "Assistente AI",
                    "QR Code",
                  ].map((link) => (
                    <li key={link}>
                      <a
                        className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                        href="#prodotto"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display font-semibold text-primary-foreground/70 text-sm">
                  Link
                </h4>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a
                      className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                      href="#come-funziona"
                    >
                      Come funziona
                    </a>
                  </li>
                  <li>
                    <a
                      className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                      href="#contatti"
                    >
                      Contattaci
                    </a>
                  </li>
                  <li>
                    <a
                      className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                      href="mailto:team@avomenu.com"
                    >
                      team@avomenu.com
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-display font-semibold text-primary-foreground/70 text-sm">
                  Legale
                </h4>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a
                      className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                      href="/privacy"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      className="text-primary-foreground/40 text-sm transition-colors hover:text-primary-foreground/70"
                      href="/cookie-policy"
                    >
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-primary-foreground/8 border-t pt-6 md:flex-row">
              <div className="text-center text-primary-foreground/30 text-xs md:text-left">
                <p>
                  &copy; {new Date().getFullYear()} Coreform Limited. Tutti i
                  diritti riservati.
                </p>
                <p className="mt-1">
                  Company No. 16633802 &middot; Registered in England and Wales
                </p>
              </div>
              <a
                className="flex items-center gap-1.5 text-primary-foreground/30 text-xs transition-colors hover:text-primary-foreground/50"
                href="https://coreform.ai/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Un prodotto{" "}
                <Image
                  alt="Coreform"
                  className="inline-block h-3.5 w-auto"
                  height={14}
                  src="/images/coreform-logo.png"
                  width={80}
                />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {structuredData.map((item) => (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be serialized as raw JSON.
          // biome-ignore lint/suspicious/noArrayIndexKey: structuredData is a stable static array.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          key={
            (item as { "@type"?: string })["@type"] ??
            JSON.stringify(item).slice(0, 24)
          }
          type="application/ld+json"
        />
      ))}
    </>
  );
}
