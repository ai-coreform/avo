import type { Task } from "graphile-worker";
import { purgeExpiredIdempotencyKeys } from "@/middleware/partner-idempotency";
import { cleanupAbandonedProvisions } from "@/operations/partner/provision";

/**
 * Graphile-worker task: abandons pending_claim provisions whose claim token
 * has expired. Idempotent — safe to run at any time.
 *
 * Payload: none.
 */
export const partnerCleanupAbandonedProvisionsTask: Task = async () => {
  const count = await cleanupAbandonedProvisions();
  if (count > 0) {
    console.info(`[partner] abandoned ${count} stale provision(s)`);
  }
};

/**
 * Graphile-worker task: removes expired partner idempotency records.
 */
export const partnerPurgeIdempotencyKeysTask: Task = async () => {
  await purgeExpiredIdempotencyKeys();
};
