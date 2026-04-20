"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@avo/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@avo/ui/components/ui/popover";
import { MapPin, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { placesApi } from "@/api/places";
import type { AddressResolution } from "@/api/places/types";
import { usePlacesAutocomplete } from "@/api/places/use-places-autocomplete";
import { VenueMap } from "./venue-map";
import type { VenueFormValues } from "./venue-page-view";

interface AddressSectionProps {
  form: UseFormReturn<VenueFormValues>;
}

function commandEmptyText(isLoading: boolean, search: string): string {
  if (isLoading) {
    return "Cercando...";
  }
  if (search.length < 2) {
    return "Digita almeno 2 caratteri";
  }
  return "Nessun risultato";
}

function buildDisplayLines(form: UseFormReturn<VenueFormValues>): string[] {
  const values = form.getValues();
  return [
    values.addressLine1,
    [values.postalCode, values.city].filter(Boolean).join(" "),
    values.region,
    values.country,
  ].filter((v): v is string => Boolean(v?.trim()));
}

export function AddressSection({ form }: AddressSectionProps) {
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const { search, setSearch, suggestions, isLoading } = usePlacesAutocomplete();

  const currentAddress = form.watch("address");
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const hasAddress = Boolean(currentAddress);

  const applyResolution = useCallback(
    (resolution: AddressResolution) => {
      form.setValue("address", resolution.formattedAddress ?? null, {
        shouldDirty: true,
      });
      form.setValue("addressLine1", resolution.line1 ?? null, {
        shouldDirty: true,
      });
      form.setValue("addressLine2", resolution.line2 ?? null, {
        shouldDirty: true,
      });
      form.setValue("city", resolution.city ?? null, { shouldDirty: true });
      form.setValue("region", resolution.region ?? null, {
        shouldDirty: true,
      });
      form.setValue("postalCode", resolution.postalCode ?? null, {
        shouldDirty: true,
      });
      form.setValue("country", resolution.country ?? null, {
        shouldDirty: true,
      });
      form.setValue("countryCode", resolution.countryCode ?? null, {
        shouldDirty: true,
      });
      form.setValue("placeId", resolution.placeId ?? null, {
        shouldDirty: true,
      });
      form.setValue("latitude", resolution.latitude ?? null, {
        shouldDirty: true,
      });
      form.setValue("longitude", resolution.longitude ?? null, {
        shouldDirty: true,
      });
    },
    [form]
  );

  const handleSelect = useCallback(
    async (placeId: string) => {
      setOpen(false);
      setResolving(true);
      try {
        const response = await placesApi.resolve(placeId);
        applyResolution(response.data);
      } catch {
        // Silently handle errors — the user can retry
      } finally {
        setResolving(false);
      }
    },
    [applyResolution]
  );

  const handleClear = useCallback(() => {
    form.setValue("address", null, { shouldDirty: true });
    form.setValue("addressLine1", null, { shouldDirty: true });
    form.setValue("addressLine2", null, { shouldDirty: true });
    form.setValue("city", null, { shouldDirty: true });
    form.setValue("region", null, { shouldDirty: true });
    form.setValue("postalCode", null, { shouldDirty: true });
    form.setValue("country", null, { shouldDirty: true });
    form.setValue("countryCode", null, { shouldDirty: true });
    form.setValue("placeId", null, { shouldDirty: true });
    form.setValue("latitude", null, { shouldDirty: true });
    form.setValue("longitude", null, { shouldDirty: true });
    setSearch("");
  }, [form, setSearch]);

  const handleCoordinateChange = useCallback(
    (lat: number, lng: number) => {
      form.setValue("latitude", lat, { shouldDirty: true });
      form.setValue("longitude", lng, { shouldDirty: true });
    },
    [form]
  );

  const displayLines = buildDisplayLines(form);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg">Indirizzo</h3>
        <p className="text-muted-foreground text-sm">
          Cerca il tuo locale su Google Maps e posiziona il pin.
        </p>
      </div>

      {hasAddress && displayLines.length > 0 ? (
        <div className="space-y-4">
          {/* Address card */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="space-y-0.5">
                {displayLines.map((line) => (
                  <p className="text-sm" key={line}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <Button
              className="shrink-0"
              onClick={handleClear}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Change address */}
          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
              <Button
                className="w-full justify-start"
                disabled={resolving}
                type="button"
                variant="outline"
              >
                <Search className="size-4" />
                {resolving ? "Caricamento..." : "Cambia indirizzo"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[400px] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  onValueChange={setSearch}
                  placeholder="Cerca indirizzo..."
                  value={search}
                />
                <CommandList>
                  <CommandEmpty>
                    {commandEmptyText(isLoading, search)}
                  </CommandEmpty>
                  <CommandGroup>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.placeId}
                        onSelect={() => handleSelect(suggestion.placeId)}
                        value={suggestion.placeId}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {suggestion.mainText}
                          </p>
                          {suggestion.secondaryText ? (
                            <p className="text-muted-foreground text-xs">
                              {suggestion.secondaryText}
                            </p>
                          ) : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Map */}
          {typeof latitude === "number" && typeof longitude === "number" ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Trascina la mappa per posizionare il pin con precisione.
              </p>
              <VenueMap
                latitude={latitude}
                longitude={longitude}
                onCoordinateChange={handleCoordinateChange}
              />
            </div>
          ) : null}
        </div>
      ) : (
        /* No address yet — show search */
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <Button
              className="w-full justify-start"
              disabled={resolving}
              type="button"
              variant="outline"
            >
              <Search className="size-4" />
              {resolving ? "Caricamento..." : "Cerca il tuo locale"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[400px] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                onValueChange={setSearch}
                placeholder="Cerca indirizzo o nome locale..."
                value={search}
              />
              <CommandList>
                <CommandEmpty>
                  {commandEmptyText(isLoading, search)}
                </CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.placeId}
                      onSelect={() => handleSelect(suggestion.placeId)}
                      value={suggestion.placeId}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {suggestion.mainText}
                        </p>
                        {suggestion.secondaryText ? (
                          <p className="text-muted-foreground text-xs">
                            {suggestion.secondaryText}
                          </p>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
