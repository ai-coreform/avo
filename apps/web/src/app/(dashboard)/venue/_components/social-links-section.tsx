"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import Image from "next/image";
import type { Control } from "react-hook-form";
import type { VenueFormValues } from "./venue-page-view";

function SocialIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      alt={alt}
      className="size-4 rounded-sm"
      height={16}
      src={src}
      width={16}
    />
  );
}

interface SocialLinksSectionProps {
  control: Control<VenueFormValues>;
}

export function SocialLinksSection({ control }: SocialLinksSectionProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg">Link social</h3>
        <p className="text-muted-foreground text-sm">
          Aggiungi i link ai tuoi profili social.
        </p>
      </div>

      <FormField
        control={control}
        name="socials.instagramUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <SocialIcon alt="Instagram" src="/instagram.svg" />
              Instagram
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://instagram.com/tuolocale"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="socials.tiktokUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <SocialIcon alt="TikTok" src="/tik-tok.svg" />
              TikTok
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://tiktok.com/@tuolocale"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="socials.facebookUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <SocialIcon alt="Facebook" src="/facebook.svg" />
              Facebook
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://facebook.com/tuolocale"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
