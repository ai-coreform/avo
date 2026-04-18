import { eq, sql } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { onboardingJob } from "@/db/schema/onboarding-job";
import { generateUniqueVenueSlug } from "@/lib/onboarding/utils";

// ---------------------------------------------------------------------------
// FormData helpers
// ---------------------------------------------------------------------------

type ParsedBodyValue = string | File | (string | File)[] | undefined;

function extractString(value: ParsedBodyValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const s = value.find((v) => typeof v === "string");
    return typeof s === "string" ? s : undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_NAME = "onboarding";
const TASK_IDENTIFIER = "onboarding.import";

// ---------------------------------------------------------------------------
// POST /import — enqueue an onboarding job
// ---------------------------------------------------------------------------

export async function importVenue(c: Context) {
  const body = await c.req.parseBody({ all: true });

  const restaurantName = extractString(body.restaurantName)?.trim();
  const slugInput = extractString(body.slug)?.trim();
  const restaurantWebsite = extractString(body.restaurantWebsite)?.trim();

  if (!restaurantName) {
    throw new HTTPException(400, { message: "Restaurant name is required" });
  }

  if (!restaurantWebsite) {
    throw new HTTPException(400, { message: "Website URL is required" });
  }

  // Generate slug
  const venueSlug =
    slugInput || (await generateUniqueVenueSlug(restaurantName));

  // Check slug uniqueness
  const existingVenue = await database
    .select({ id: venue.id })
    .from(venue)
    .where(eq(venue.slug, venueSlug))
    .limit(1);

  if (existingVenue.length > 0) {
    throw new HTTPException(409, { message: "Venue slug is already taken" });
  }

  const user = c.get("user") as { id: string };

  // Create job record
  const [job] = await database
    .insert(onboardingJob)
    .values({
      restaurantName,
      slug: venueSlug,
      websiteUrl: restaurantWebsite,
      createdBy: user.id,
    })
    .returning();

  // Enqueue via Graphile Worker
  const payload = { jobId: job.id };
  await database.execute(
    sql`select graphile_worker.add_job(${TASK_IDENTIFIER}, ${JSON.stringify(payload)}::json, queue_name := ${QUEUE_NAME})`
  );

  return c.json(
    {
      jobId: job.id,
      status: job.status,
    },
    202
  );
}
