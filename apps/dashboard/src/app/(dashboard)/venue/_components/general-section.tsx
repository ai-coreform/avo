"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@avo/ui/components/ui/form";
import { Input } from "@avo/ui/components/ui/input";
import type { Control } from "react-hook-form";
import type { VenueFormValues } from "./venue-page-view";

interface GeneralSectionProps {
  control: Control<VenueFormValues>;
  slug: string;
  onSlugChange: (value: string) => void;
}

export function GeneralSection({
  control,
  slug,
  onSlugChange,
}: GeneralSectionProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg">
          Informazioni generali
        </h3>
        <p className="text-muted-foreground text-sm">
          Nome e indirizzo web del tuo locale.
        </p>
      </div>

      <div className="space-y-5">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome del locale</FormLabel>
              <FormControl>
                <Input placeholder="es. Ristorante Da Mario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="es. ristorante-da-mario"
                />
              </FormControl>
              <FormDescription>
                I tuoi menu saranno visibili su{" "}
                <span className="font-medium text-foreground">
                  avomenu.com/m/{slug || "..."}/nome-menu
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
