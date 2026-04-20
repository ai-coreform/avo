import { Globe, Search } from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";

const items = [
  {
    name: "Burrata pugliese",
    desc: "Datterini, basilico, olio EVO",
    price: "14.00",
    allergens: ["🥛"],
  },
  {
    name: "Tartare di tonno",
    desc: "Avocado, sesamo, salsa di soia",
    price: "16.00",
    allergens: ["🐟"],
  },
  {
    name: "Carpaccio di polpo",
    desc: "Patate tiepide, olive taggiasche",
    price: "13.00",
    allergens: ["🐟"],
  },
  {
    name: "Vitello tonnato",
    desc: "Salsa tonnata della tradizione",
    price: "12.00",
    allergens: [] as string[],
  },
];

export function MenuMockup() {
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
          <div className="flex items-center gap-1 rounded-md bg-ink/5 px-1.5 py-0.5">
            <Globe className="size-3 text-ink/50" />
            <span className="font-medium text-[10px] text-ink/60">IT</span>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-ink/8 border-b">
        <button
          className="flex-1 border-primary border-b-2 py-2 font-display font-semibold text-[11px] text-primary"
          type="button"
        >
          Mangiare
        </button>
        <button
          className="flex-1 py-2 font-display font-medium text-[11px] text-ink/40"
          type="button"
        >
          Bere
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-hidden px-4 py-3">
        <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 font-semibold text-[9px] text-primary-foreground">
          Antipasti
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Primi
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Secondi
        </span>
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 font-medium text-[9px] text-ink/40">
          Dolci
        </span>
      </div>

      {/* Group heading */}
      <div className="px-4 pt-2 pb-1">
        <span className="font-bold font-display text-base text-ink lowercase tracking-tight">
          antipasti<span className="text-primary">.</span>
        </span>
      </div>

      {/* Menu items */}
      <div className="px-4 pb-4">
        {items.map((item) => (
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
            {item.allergens.length > 0 && (
              <div className="mt-1 flex gap-0.5">
                {item.allergens.map((a) => (
                  <span className="text-[8px]" key={a}>
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}
