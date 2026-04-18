import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { onboardingJob } from "@/db/schema/onboarding-job";

export async function getImportStatus(c: Context, params: { jobId: string }) {
  const [job] = await database
    .select()
    .from(onboardingJob)
    .where(eq(onboardingJob.id, params.jobId))
    .limit(1);

  if (!job) {
    throw new HTTPException(404, { message: "Job not found" });
  }

  return c.json({
    jobId: job.id,
    status: job.status,
    currentStep: job.currentStep,
    totalSteps: job.totalSteps,
    completedSteps: job.completedSteps,
    errorMessage: job.errorMessage,
    venueId: job.venueId,
    venueSlug: job.venueSlug,
    result: job.result,
  });
}
