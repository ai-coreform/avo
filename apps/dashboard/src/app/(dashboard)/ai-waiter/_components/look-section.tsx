"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import { MessageSquare } from "lucide-react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { AiWaiterFormValues } from "./types";

interface LookSectionProps {
  control: Control<AiWaiterFormValues>;
}

const HASH_PREFIX_RE = /^#+/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{0,6}$/;

function normalizeHexInput(raw: string): string | null {
  const trimmed = raw.trim();
  const v = `#${trimmed.replace(HASH_PREFIX_RE, "").slice(0, 6)}`;
  return HEX_COLOR_RE.test(v) ? v : null;
}

export function LookSection({ control }: LookSectionProps) {
  const bgColor = useWatch({ control, name: "bgColor" });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg">Aspetto</h3>
        <p className="text-muted-foreground text-sm">
          Definisci il colore dell&apos;avatar dell&apos;assistente. Si applica
          al pulsante in basso a destra del menu e al cerchio in apertura della
          chat.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)] md:items-stretch">
        {/* Left: compact picker + description */}
        <FormField
          control={control}
          name="bgColor"
          render={({ field }) => (
            <FormItem className="self-center">
              <Label className="text-sm">Colore avatar</Label>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Avatar color picker"
                    className="h-10 w-10 cursor-pointer rounded-md border bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                    onChange={(e) => field.onChange(e.target.value)}
                    type="color"
                    value={field.value}
                  />
                  <Input
                    aria-label="Avatar color hex value"
                    className="w-28 font-mono text-sm uppercase"
                    maxLength={7}
                    onChange={(e) => {
                      const next = normalizeHexInput(e.target.value);
                      if (next) {
                        field.onChange(next);
                      }
                    }}
                    value={field.value}
                  />
                </div>
              </FormControl>
              <p className="text-muted-foreground text-sm">
                Il cerchio dietro il simbolo dell&apos;assistente.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Right: standalone preview card with the FAB at real size */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-muted/40 px-6 py-7">
          <FabPreview bgColor={bgColor} />
          <p className="text-muted-foreground text-xs">Anteprima del pulsante</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Faithful preview of AvoChatFab at the same size the customer sees in the
 * menu. Mirrors apps/.../public-menu/.../avo-chat-fab.tsx so admins are looking
 * at exactly what will ship.
 */
function FabPreview({ bgColor }: { bgColor: string }) {
  return (
    <div className="relative">
      <div
        className="flex size-16 items-center justify-center rounded-full p-3.5 shadow-lg"
        style={{ backgroundColor: bgColor }}
      >
        {/* biome-ignore lint/performance/noImgElement: static asset */}
        {/* biome-ignore lint/correctness/useImageSize: sized via CSS */}
        <img
          alt=""
          className="size-full object-contain"
          src="/images/avo-icon-white.svg"
        />
      </div>
      <div
        className="-top-0.5 -right-0.5 absolute flex size-7 items-center justify-center rounded-full border-2 border-background shadow-sm"
        style={{ backgroundColor: bgColor }}
      >
        <MessageSquare className="size-3.5 fill-white text-white" />
      </div>
    </div>
  );
}
