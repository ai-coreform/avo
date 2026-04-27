"use client";

import { cn } from "@avo/ui/lib/utils";
import { Check } from "lucide-react";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";
import {
  PERSONALITY_PRESETS,
  type PersonalityPreset,
  type PersonalitySlug,
} from "./personality-presets";
import type { AiWaiterFormValues } from "./types";

interface PersonalitySectionProps {
  control: Control<AiWaiterFormValues>;
}

export function PersonalitySection({ control }: PersonalitySectionProps) {
  const { field } = useController({ control, name: "personality" });
  const selected: PersonalitySlug = field.value;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg">Personalità</h3>
        <p className="text-muted-foreground text-sm">
          Scegli il tono di voce dell&apos;assistente. Ogni personalità cambia
          il modo in cui risponde ai clienti, mantenendo le stesse capacità.
        </p>
      </div>

      <div
        aria-label="Seleziona la personalità dell'assistente"
        className="grid gap-3 md:grid-cols-2"
        role="radiogroup"
      >
        {PERSONALITY_PRESETS.map((preset) => (
          <PersonalityCard
            isSelected={selected === preset.slug}
            key={preset.slug}
            onSelect={() => field.onChange(preset.slug)}
            preset={preset}
          />
        ))}
      </div>
    </div>
  );
}

interface PersonalityCardProps {
  preset: PersonalityPreset;
  isSelected: boolean;
  onSelect: () => void;
}

function PersonalityCard({
  preset,
  isSelected,
  onSelect,
}: PersonalityCardProps) {
  const Icon = preset.icon;

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "hover:border-foreground/30 hover:bg-accent/30",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-offset-2",
        isSelected
          ? "border-foreground/70 ring-1 ring-foreground/50"
          : "border-border"
      )}
    >
      <input
        checked={isSelected}
        className="sr-only"
        name="ai-waiter-personality"
        onChange={onSelect}
        type="radio"
        value={preset.slug}
      />
      {/* Selected check */}
      <span
        aria-hidden
        className={cn(
          "absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-all",
          isSelected
            ? "border-foreground bg-foreground text-background"
            : "border-muted-foreground/30 bg-background text-transparent"
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>

      {/* Header: monogram + name */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${preset.accent}1A`,
            color: preset.accent,
          }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 pr-7">
          <p className="font-display font-semibold text-base leading-tight">
            {preset.name}
          </p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {preset.tagline}
          </p>
        </div>
      </div>

      {/* Voice sample — the differentiator */}
      <blockquote
        className="relative rounded-lg bg-muted/50 px-4 py-3 text-foreground/85 text-sm italic leading-snug"
        style={{ borderLeft: `2px solid ${preset.accent}` }}
      >
        <span
          aria-hidden
          className="absolute top-1 left-1.5 select-none font-serif text-2xl text-muted-foreground/40 leading-none"
        >
          &ldquo;
        </span>
        <span className="relative pl-3">{preset.voiceSample}</span>
      </blockquote>

      {/* Fits for */}
      <p className="text-muted-foreground text-xs">
        <span className="font-medium text-foreground/70">Adatto a: </span>
        {preset.fitsFor}
      </p>
    </label>
  );
}
