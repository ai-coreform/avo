import { Check, Globe, Search, Send, Sparkles } from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";

const glutenFreeItems: [string, string][] = [
  ["Tartare di tonno", "avocado & sesame"],
  ["Tagliata di manzo", "rocket & parmesan"],
  ["Insalata di polpo", "potatoes & olives"],
];

export function ChatMockup() {
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
            <span className="font-medium text-[10px] text-ink/60">EN</span>
          </div>
        </div>
      </div>

      {/* Chat UI */}
      <div className="border-ink/8 border-t">
        <div className="flex items-center gap-2.5 border-ink/8 border-b px-4 py-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary">
            <Sparkles className="size-3.5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-[11px] text-ink">
              Avo Assistant
            </div>
            <div className="flex items-center gap-1 text-[8px] text-ink/40">
              <span className="size-1 rounded-full bg-green-500" />
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 p-4">
          <div className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2">
              <p className="text-[11px] text-primary-foreground leading-relaxed">
                Which dishes are gluten-free?
              </p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-ink/5 px-3.5 py-2">
              <p className="text-[11px] text-ink leading-relaxed">
                Here are today&apos;s gluten-free options:
              </p>
              <ul className="mt-1.5 space-y-1">
                {glutenFreeItems.map(([name, desc]) => (
                  <li
                    className="flex items-start gap-1.5 text-[10px] text-ink/70"
                    key={name}
                  >
                    <Check
                      className="mt-0.5 size-2.5 shrink-0 text-primary"
                      strokeWidth={3}
                    />
                    <span>
                      <strong className="text-ink">{name}</strong>, {desc}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[9px] text-ink/40">
                Would you like more details about any of these?
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-ink/[0.04] px-3 py-2">
            <span className="flex-1 text-[10px] text-ink/30">
              Ask something...
            </span>
            <div className="flex size-6 items-center justify-center rounded-lg bg-primary">
              <Send className="size-2.5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
