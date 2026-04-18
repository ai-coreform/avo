import { and, count, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import database from "@/db";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { translationJob } from "@/db/schema/translation-job";

export interface TranslationJobRecord {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  targetLocales: string[];
  missingOnly: boolean;
  totalUnits: number;
  completedUnits: number;
  failedUnits: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface StartTranslationRunOptions {
  locales: string[];
  missingOnly?: boolean;
}

const QUEUE_NAME = "translations";
const TASK_IDENTIFIER = "translations.run";

/** Jobs older than this are considered stale and will be cleaned up. */
const STALE_JOB_MINUTES = 5;

/**
 * Returns the most recent active (pending/running) job for a venue,
 * or the most recent failed job if no active job exists.
 */
export async function getTranslationStatus(
  venueId: string
): Promise<TranslationJobRecord | null> {
  const staleThreshold = new Date(Date.now() - STALE_JOB_MINUTES * 60_000);

  // First check for active jobs (not stale)
  const [activeJob] = await database
    .select()
    .from(translationJob)
    .where(
      and(
        eq(translationJob.venueId, venueId),
        inArray(translationJob.status, ["pending", "running"]),
        gt(translationJob.createdAt, staleThreshold)
      )
    )
    .orderBy(desc(translationJob.createdAt))
    .limit(1);

  if (activeJob) {
    return serializeJob(activeJob);
  }

  // Fall back to most recent failed job (so frontend can show retry)
  const [recentFailed] = await database
    .select()
    .from(translationJob)
    .where(
      and(
        eq(translationJob.venueId, venueId),
        eq(translationJob.status, "failed")
      )
    )
    .orderBy(desc(translationJob.createdAt))
    .limit(1);

  if (recentFailed) {
    return serializeJob(recentFailed);
  }

  return null;
}

/**
 * Creates a new translation job and enqueues it via Graphile Worker.
 */
export async function startTranslationRun(
  venueId: string,
  options: StartTranslationRunOptions
): Promise<TranslationJobRecord | null> {
  const targetLocales = options.locales.filter((l) => l !== "it");
  console.log("[job] startTranslationRun called", {
    venueId,
    targetLocales,
    options,
  });
  if (targetLocales.length === 0) {
    console.log("[job] No target locales after filtering, skipping");
    return null;
  }

  // Clean up stale jobs before checking for active ones
  await clearStaleJobs(venueId);

  // Check for already-running job
  const [existing] = await database
    .select({
      id: translationJob.id,
      status: translationJob.status,
      createdAt: translationJob.createdAt,
    })
    .from(translationJob)
    .where(
      and(
        eq(translationJob.venueId, venueId),
        inArray(translationJob.status, ["pending", "running"])
      )
    )
    .limit(1);

  if (existing) {
    console.log("[job] Found existing active job, skipping creation", existing);
    const status = await getTranslationStatus(venueId);
    return status;
  }

  // Count total translatable entities upfront
  const menuIds = (
    await database
      .select({ id: menu.id })
      .from(menu)
      .where(eq(menu.venueId, venueId))
  ).map((r) => r.id);

  let totalUnits = 0;
  if (menuIds.length > 0) {
    const [[tabs], [cats], [entries]] = await Promise.all([
      database
        .select({ count: count() })
        .from(menuTab)
        .where(inArray(menuTab.menuId, menuIds)),
      database
        .select({ count: count() })
        .from(menuCategory)
        .where(inArray(menuCategory.menuId, menuIds)),
      database
        .select({ count: count() })
        .from(menuEntry)
        .where(inArray(menuEntry.menuId, menuIds)),
    ]);
    totalUnits =
      (tabs?.count ?? 0) + (cats?.count ?? 0) + (entries?.count ?? 0);
  }

  // Create job record with total already set
  const [job] = await database
    .insert(translationJob)
    .values({
      venueId,
      status: "pending",
      targetLocales,
      missingOnly: options.missingOnly ? 1 : 0,
      totalUnits,
    })
    .returning();
  console.log("[job] Created translation_job row", {
    jobId: job.id,
    totalUnits,
  });

  // Enqueue via Graphile Worker
  const payload = { jobId: job.id, venueId };
  console.log("[job] Enqueueing graphile job", payload);
  await database.execute(
    sql`select graphile_worker.add_job(${TASK_IDENTIFIER}, ${JSON.stringify(payload)}::json, queue_name := ${QUEUE_NAME})`
  );

  return serializeJob(job);
}

/**
 * Clear old failed jobs for a venue.
 */
export async function clearFailedJobs(venueId: string): Promise<void> {
  await database
    .delete(translationJob)
    .where(
      and(
        eq(translationJob.venueId, venueId),
        eq(translationJob.status, "failed")
      )
    );
}

/**
 * Clear stale pending/running jobs that never completed (worker crashed, etc).
 */
async function clearStaleJobs(venueId: string): Promise<void> {
  const staleThreshold = new Date(Date.now() - STALE_JOB_MINUTES * 60_000);

  await database
    .delete(translationJob)
    .where(
      and(
        eq(translationJob.venueId, venueId),
        inArray(translationJob.status, ["pending", "running"]),
        lt(translationJob.createdAt, staleThreshold)
      )
    );
}

function serializeJob(
  row: typeof translationJob.$inferSelect
): TranslationJobRecord {
  return {
    id: row.id,
    status: row.status as TranslationJobRecord["status"],
    targetLocales: row.targetLocales,
    missingOnly: row.missingOnly === 1,
    totalUnits: row.totalUnits,
    completedUnits: row.completedUnits,
    failedUnits: row.failedUnits,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
