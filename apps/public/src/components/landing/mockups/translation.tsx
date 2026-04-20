import { Globe, Search } from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";

const frenchItems = [
  {
    name: "Burrata des Pouilles",
    desc: "Tomates datterini, basilic, huile EVO",
    price: "14.00",
  },
  {
    name: "Tartare de thon",
    desc: "Avocat, sésame, sauce soja",
    price: "16.00",
  },
  {
    name: "Carpaccio de poulpe",
    desc: "Pommes de terre, olives taggiasca",
    price: "13.00",
  },
  {
    name: "Vitello tonnato",
    desc: "Sauce au thon traditionnelle",
    price: "12.00",
  },
];

const flags = ["🇮🇹", "🇬🇧", "🇫🇷", "🇩🇪", "🇪🇸", "🇯🇵", "🇨🇳", "🇵🇹"];

export function TranslationMockup() {
  return (
    <PhoneFrame>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
            <span className="font-bold text-[9px] text-primary">DM</span>
          </div>
          <span className="font-bold font-display text-[13px] text-ink">
            Da Mario
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Search className="size-[18px] text-ink/50" strokeWidth={1.8} />
          <div className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 ring-1 ring-primary/20">
            <Globe className="size-3 text-primary" />
            <span className="font-medium text-[10px] text-primary">FR</span>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-ink/8 border-b">
        <button
          className="flex-1 border-primary border-b-2 py-2 font-display font-semibold text-[11px] text-primary"
          type="button"
        >
          Manger
        </button>
        <button
          className="flex-1 py-2 font-display font-medium text-[11px] text-ink/40"
          type="button"
        >
          Boire
        </button>
      </div>

      {/* Category pills in French */}
      <div className="flex gap-1.5 overflow-hidden px-4 py-3">
        <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 font-semibold text-[9px] text-primary-foreground">
          Entrées
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Premiers
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Seconds
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Desserts
        </span>
      </div>

      {/* Group heading */}
      <div className="px-4 pt-2 pb-1">
        <span className="font-bold font-display text-base text-ink lowercase tracking-tight">
          entrées<span className="text-primary">.</span>
        </span>
      </div>

      {/* French-translated menu items */}
      <div className="px-4 pb-4">
        {frenchItems.map((item) => (
          <div className="pt-4" key={item.name}>
            <div className="flex items-baseline">
              <span className="font-display font-semibold text-[11px] text-ink uppercase">
                {item.name}
              </span>
              <span className="mx-2 mb-[3px] flex-1 border-ink/15 border-b border-dotted" />
              <span className="whitespace-nowrap font-display font-semibold text-[11px] text-primary">
                {item.price}
              </span>
            </div>
            <p className="mt-0.5 text-[9px] text-ink/50 leading-snug">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Language flags bar */}
      <div className="border-ink/8 border-t px-4 pt-2 pb-4">
        <p className="mb-2 text-center text-[8px] text-ink/30">
          Disponible en 30+ langues
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {flags.map((flag) => (
            <span className="text-[11px]" key={flag}>
              {flag}
            </span>
          ))}
          <span className="ml-0.5 text-[8px] text-ink/30">+22</span>
        </div>
      </div>
    </PhoneFrame>
  );
}
