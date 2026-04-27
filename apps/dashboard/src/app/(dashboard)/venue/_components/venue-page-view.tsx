"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Form } from "@avo/ui/components/ui/form";
import { Separator } from "@avo/ui/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { VenueData } from "@/api/venue/types";
import { useUpdateVenue } from "@/api/venue/use-update-venue";
import { PageActions } from "@/providers/page-header-provider";
import { slugify } from "@/utils/slugify";
import { AddressSection } from "./address-section";
import { GeneralSection } from "./general-section";
import { SocialLinksSection } from "./social-links-section";

const venueFormSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(120),
  logo: z.string().nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Lo slug è obbligatorio")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo lettere minuscole, numeri e trattini"
    ),
  socials: z.object({
    instagramUrl: z.string().url("URL non valido").or(z.literal("")).optional(),
    tiktokUrl: z.string().url("URL non valido").or(z.literal("")).optional(),
    facebookUrl: z.string().url("URL non valido").or(z.literal("")).optional(),
  }),
  address: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type VenueFormValues = z.infer<typeof venueFormSchema>;

export function VenuePageView({ data }: { data: VenueData }) {
  const updateVenue = useUpdateVenue();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const slugTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: data.name,
      logo: data.logo ?? null,
      slug: data.slug,
      socials: {
        instagramUrl: data.socials?.instagramUrl ?? "",
        tiktokUrl: data.socials?.tiktokUrl ?? "",
        facebookUrl: data.socials?.facebookUrl ?? "",
      },
      address: data.address,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      country: data.country,
      countryCode: data.countryCode,
      placeId: data.placeId,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  // Auto-generate slug from name (debounced)
  const watchedName = form.watch("name");
  useEffect(() => {
    if (slugManuallyEdited) {
      return;
    }

    if (slugTimeoutRef.current) {
      clearTimeout(slugTimeoutRef.current);
    }

    slugTimeoutRef.current = setTimeout(() => {
      const generated = slugify(watchedName);
      if (generated) {
        form.setValue("slug", generated, { shouldDirty: true });
      }
    }, 500);

    return () => {
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
    };
  }, [watchedName, slugManuallyEdited, form]);

  const handleSlugChange = useCallback(
    (value: string) => {
      setSlugManuallyEdited(true);
      form.setValue("slug", value, { shouldDirty: true, shouldValidate: true });
    },
    [form]
  );

  const onSubmit = useCallback(
    async (values: VenueFormValues) => {
      await updateVenue.mutateAsync(values);
      form.reset(values);
      setSlugManuallyEdited(false);
    },
    [updateVenue, form]
  );

  return (
    <Form {...form}>
      <form
        className="px-4 pb-8"
        id="venue-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <PageActions>
          <Button
            disabled={!isDirty}
            onClick={() => {
              form.reset();
              setSlugManuallyEdited(false);
            }}
            type="button"
            variant="outline"
          >
            <Undo2 className="size-4" />
            Ripristina
          </Button>
          <Button
            disabled={isSubmitting || !isDirty}
            form="venue-form"
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salva
          </Button>
        </PageActions>

        <div className="mt-6 max-w-2xl space-y-8">
          <GeneralSection
            control={form.control}
            onSlugChange={handleSlugChange}
            slug={form.watch("slug")}
          />

          <Separator />

          <SocialLinksSection control={form.control} />

          <Separator />

          <AddressSection form={form} />
        </div>
      </form>
    </Form>
  );
}
