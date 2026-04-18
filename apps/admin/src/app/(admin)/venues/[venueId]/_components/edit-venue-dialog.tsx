"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useUpdateVenue } from "@/api/venues/use-update-venue";

interface VenueData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string | null;
  defaultLocale: string | null;
  address: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  countryCode: string | null;
  socials: {
    instagramUrl?: string;
    tiktokUrl?: string;
    facebookUrl?: string;
  } | null;
}

interface EditVenueDialogProps {
  venue: VenueData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVenueDialog({
  venue,
  open,
  onOpenChange,
}: EditVenueDialogProps) {
  const mutation = useUpdateVenue(venue.id);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo: "",
    timezone: "",
    defaultLocale: "",
    address: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    countryCode: "",
    instagramUrl: "",
    tiktokUrl: "",
    facebookUrl: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: venue.name ?? "",
        slug: venue.slug ?? "",
        logo: venue.logo ?? "",
        timezone: venue.timezone ?? "",
        defaultLocale: venue.defaultLocale ?? "",
        address: venue.address ?? "",
        addressLine1: venue.addressLine1 ?? "",
        addressLine2: venue.addressLine2 ?? "",
        city: venue.city ?? "",
        region: venue.region ?? "",
        postalCode: venue.postalCode ?? "",
        country: venue.country ?? "",
        countryCode: venue.countryCode ?? "",
        instagramUrl: venue.socials?.instagramUrl ?? "",
        tiktokUrl: venue.socials?.tiktokUrl ?? "",
        facebookUrl: venue.socials?.facebookUrl ?? "",
      });
    }
  }, [open, venue]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data: Record<string, unknown> = {
      name: form.name || undefined,
      slug: form.slug || undefined,
      logo: form.logo || null,
      timezone: form.timezone || undefined,
      defaultLocale: form.defaultLocale || undefined,
      address: form.address || null,
      addressLine1: form.addressLine1 || null,
      addressLine2: form.addressLine2 || null,
      city: form.city || null,
      region: form.region || null,
      postalCode: form.postalCode || null,
      country: form.country || null,
      countryCode: form.countryCode || null,
      socials: {
        instagramUrl: form.instagramUrl || undefined,
        tiktokUrl: form.tiktokUrl || undefined,
        facebookUrl: form.facebookUrl || undefined,
      },
    };

    mutation.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica venue</DialogTitle>
          <DialogDescription>
            Aggiorna dettagli venue, indirizzo e link social.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Generale</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueName">Nome</Label>
                <Input
                  id="venueName"
                  onChange={(e) => handleChange("name", e.target.value)}
                  value={form.name}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueSlug">Slug</Label>
                <Input
                  id="venueSlug"
                  onChange={(e) => handleChange("slug", e.target.value)}
                  value={form.slug}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueLogo">URL logo</Label>
              <Input
                id="venueLogo"
                onChange={(e) => handleChange("logo", e.target.value)}
                value={form.logo}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueTimezone">Fuso orario</Label>
                <Input
                  id="venueTimezone"
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  value={form.timezone}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueLocale">Lingua predefinita</Label>
                <Input
                  id="venueLocale"
                  onChange={(e) =>
                    handleChange("defaultLocale", e.target.value)
                  }
                  value={form.defaultLocale}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Indirizzo</legend>
            <div className="space-y-1.5">
              <Label htmlFor="venueAddress">Indirizzo completo</Label>
              <Input
                id="venueAddress"
                onChange={(e) => handleChange("address", e.target.value)}
                value={form.address}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueLine1">Indirizzo riga 1</Label>
                <Input
                  id="venueLine1"
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  value={form.addressLine1}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueLine2">Indirizzo riga 2</Label>
                <Input
                  id="venueLine2"
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  value={form.addressLine2}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="venueCity">Città</Label>
                <Input
                  id="venueCity"
                  onChange={(e) => handleChange("city", e.target.value)}
                  value={form.city}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueRegion">Regione</Label>
                <Input
                  id="venueRegion"
                  onChange={(e) => handleChange("region", e.target.value)}
                  value={form.region}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venuePostal">CAP</Label>
                <Input
                  id="venuePostal"
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  value={form.postalCode}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueCountry">Paese</Label>
                <Input
                  id="venueCountry"
                  onChange={(e) => handleChange("country", e.target.value)}
                  value={form.country}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueCountryCode">Codice paese</Label>
                <Input
                  id="venueCountryCode"
                  maxLength={2}
                  onChange={(e) => handleChange("countryCode", e.target.value)}
                  value={form.countryCode}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Social</legend>
            <div className="space-y-1.5">
              <Label htmlFor="venueInstagram">Instagram URL</Label>
              <Input
                id="venueInstagram"
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
                value={form.instagramUrl}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueTiktok">TikTok URL</Label>
              <Input
                id="venueTiktok"
                onChange={(e) => handleChange("tiktokUrl", e.target.value)}
                value={form.tiktokUrl}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueFacebook">Facebook URL</Label>
              <Input
                id="venueFacebook"
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
                value={form.facebookUrl}
              />
            </div>
          </fieldset>

          {mutation.isError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
              {mutation.error.message}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annulla
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva modifiche"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
