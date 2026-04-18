import { eq } from "drizzle-orm";
import type { Task } from "graphile-worker";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";
import { onboardingJob } from "@/db/schema/onboarding-job";
import { venueLocale } from "@/db/schema/venue-locale";
import { extractMenuFromSources } from "@/lib/onboarding/menu-extract";
import { persistImportedMenu } from "@/lib/onboarding/menu-persist";
import { deriveFullThemeColors } from "@/lib/onboarding/theme";
import { scanRestaurantWebsite } from "@/lib/onboarding/website-scan";

const URL_PROTOCOL_RE = /^https?:\/\//i;
const WWW_PREFIX_RE = /^www\./;

interface OnboardingImportPayload {
  jobId: string;
}

async function updateJob(
  jobId: string,
  data: Partial<typeof onboardingJob.$inferInsert>
) {
  await database
    .update(onboardingJob)
    .set(data)
    .where(eq(onboardingJob.id, jobId));
}

export const onboardingImportTask: Task = async (_payload) => {
  const payload = (
    typeof _payload === "string" ? JSON.parse(_payload) : _payload
  ) as OnboardingImportPayload;
  const { jobId } = payload;

  const [job] = await database
    .select()
    .from(onboardingJob)
    .where(eq(onboardingJob.id, jobId))
    .limit(1);

  if (!job) {
    console.error(`[onboarding.import] Job ${jobId} not found`);
    return;
  }

  if (job.status !== "pending") {
    console.warn(
      `[onboarding.import] Job ${jobId} has status "${job.status}", skipping`
    );
    return;
  }

  await updateJob(jobId, {
    status: "running",
    startedAt: new Date(),
    currentStep: "Scanning website",
    completedSteps: 0,
  });

  let createdVenueId: string | null = null;

  try {
    // Step 1: Website scan
    const scan = await scanRestaurantWebsite(job.websiteUrl);

    await updateJob(jobId, {
      currentStep: "Collecting menu sources",
      completedSteps: 1,
    });

    // Step 2: Collect menu sources
    const imageUrls: string[] = scan.menuImageUrls ?? [];
    const pdfs: Array<{ url: string; filename: string }> = [];

    for (const docUrl of scan.menuDocumentUrls ?? []) {
      pdfs.push({ url: docUrl, filename: "website-menu.pdf" });
    }

    if (imageUrls.length === 0 && pdfs.length === 0) {
      throw new Error(
        "No menu sources found on the website. The site must contain menu images or PDF links."
      );
    }

    await updateJob(jobId, {
      currentStep: "Extracting menu with AI",
      completedSteps: 2,
    });

    // Step 3: AI menu extraction
    const extractedMenu = await extractMenuFromSources({ imageUrls, pdfs });

    await updateJob(jobId, {
      currentStep: "Creating venue",
      completedSteps: 3,
    });

    // Step 4: Create venue + member + locale + menu
    const [insertedVenue] = await database
      .insert(venue)
      .values({
        name: job.restaurantName,
        slug: job.slug,
        logo: scan.logoUrl ?? null,
        settings: {
          website: scan.normalizedUrl ?? job.websiteUrl,
          branding: scan.branding ?? null,
        },
      })
      .returning({ id: venue.id });

    createdVenueId = insertedVenue.id;

    // Create placeholder owner user from website domain
    const websiteDomain = (() => {
      try {
        const url = new URL(
          URL_PROTOCOL_RE.test(job.websiteUrl)
            ? job.websiteUrl
            : `https://${job.websiteUrl}`
        );
        return url.hostname.replace(WWW_PREFIX_RE, "");
      } catch {
        return "venue.local";
      }
    })();

    const now = new Date();
    const [ownerUser] = await database
      .insert(user)
      .values({
        name: job.restaurantName,
        email: `owner@${websiteDomain}`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: user.id });

    // Owner = placeholder user, Admin = superadmin who initiated import
    await database.insert(member).values([
      {
        venueId: createdVenueId,
        userId: ownerUser.id,
        role: "owner",
        createdAt: now,
      },
      {
        venueId: createdVenueId,
        userId: job.createdBy,
        role: "admin",
        createdAt: now,
      },
    ]);

    await database.insert(venueLocale).values({
      venueId: createdVenueId,
      locale: "it",
      sortOrder: 0,
    });

    const theme = scan.theme?.primaryColor
      ? deriveFullThemeColors(
          scan.theme.primaryColor,
          scan.theme.backgroundColor,
          scan.theme.accentColor
        )
      : {};

    const [insertedMenu] = await database
      .insert(menu)
      .values({
        venueId: createdVenueId,
        name: "Menu",
        slug: "main",
        status: "draft",
        theme,
      })
      .returning({ id: menu.id });

    await updateJob(jobId, {
      currentStep: "Persisting menu",
      completedSteps: 4,
    });

    // Step 5: Persist menu structure
    const importSummary = await persistImportedMenu(
      createdVenueId,
      insertedMenu.id,
      extractedMenu
    );

    await updateJob(jobId, {
      status: "completed",
      currentStep: null,
      completedSteps: 5,
      venueId: createdVenueId,
      venueSlug: job.slug,
      result: importSummary,
      completedAt: new Date(),
    });

    console.log(
      `[onboarding.import] Job ${jobId} completed: ${importSummary.categoryCount} categories, ${importSummary.groupCount} groups, ${importSummary.itemCount} items`
    );
  } catch (error) {
    // Cleanup venue on failure
    if (createdVenueId) {
      await database
        .delete(venue)
        .where(eq(venue.id, createdVenueId))
        .catch((e) => console.error("[onboarding.import] Cleanup failed:", e));
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[onboarding.import] Job ${jobId} failed:`, error);

    await updateJob(jobId, {
      status: "failed",
      errorMessage,
      completedAt: new Date(),
    });

    throw error;
  }
};
