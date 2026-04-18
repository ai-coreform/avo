import { and, asc, eq, ne } from "drizzle-orm";
import database from "@/db";
import { venueLocale } from "@/db/schema/venue-locale";

export function getVenueLocales(venueId: string) {
  return database.query.venueLocale.findMany({
    where: eq(venueLocale.venueId, venueId),
    orderBy: asc(venueLocale.sortOrder),
  });
}

export function getVenueSecondaryLocales(
  venueId: string,
  defaultLocale = "it"
) {
  return database.query.venueLocale.findMany({
    where: and(
      eq(venueLocale.venueId, venueId),
      eq(venueLocale.isEnabled, true),
      ne(venueLocale.locale, defaultLocale)
    ),
    orderBy: asc(venueLocale.sortOrder),
  });
}

export async function getVenueSecondaryLocaleCodes(
  venueId: string,
  defaultLocale = "it"
) {
  const locales = await getVenueSecondaryLocales(venueId, defaultLocale);
  return locales.map((l) => l.locale);
}

export async function addVenueLocale(venueId: string, locale: string) {
  const existing = await database.query.venueLocale.findFirst({
    where: and(
      eq(venueLocale.venueId, venueId),
      eq(venueLocale.locale, locale)
    ),
  });

  if (existing) {
    return existing;
  }

  // Get the next sort order
  const allLocales = await getVenueLocales(venueId);
  const maxSortOrder = allLocales.reduce(
    (max, l) => Math.max(max, l.sortOrder),
    -1
  );

  const [inserted] = await database
    .insert(venueLocale)
    .values({
      venueId,
      locale,
      isEnabled: true,
      sortOrder: maxSortOrder + 1,
    })
    .returning();

  return inserted;
}

export async function removeVenueLocale(venueId: string, locale: string) {
  const [deleted] = await database
    .delete(venueLocale)
    .where(
      and(eq(venueLocale.venueId, venueId), eq(venueLocale.locale, locale))
    )
    .returning();

  return deleted ?? null;
}

export async function updateVenueLocaleOrder(
  venueId: string,
  orderedLocales: string[]
) {
  await database.transaction(async (tx) => {
    for (let i = 0; i < orderedLocales.length; i++) {
      await tx
        .update(venueLocale)
        .set({ sortOrder: i })
        .where(
          and(
            eq(venueLocale.venueId, venueId),
            eq(venueLocale.locale, orderedLocales[i])
          )
        );
    }
  });
}

export async function toggleVenueLocale(
  venueId: string,
  locale: string,
  isEnabled: boolean
) {
  const [updated] = await database
    .update(venueLocale)
    .set({ isEnabled })
    .where(
      and(eq(venueLocale.venueId, venueId), eq(venueLocale.locale, locale))
    )
    .returning();

  return updated ?? null;
}
