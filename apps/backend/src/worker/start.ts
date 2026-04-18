import { run } from "graphile-worker";
import {
  processBatch,
  unstickStaleDelivering,
} from "@/operations/partner/webhooks/deliver";
import { onboardingImportTask } from "./tasks/onboarding-import";
import {
  partnerCleanupAbandonedProvisionsTask,
  partnerPurgeIdempotencyKeysTask,
} from "./tasks/partner-cleanup";
import { translationRunTask } from "./tasks/translation-run";

const DEFAULT_CONCURRENCY = 3;
const PARTNER_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h
const PARTNER_CLEANUP_STARTUP_DELAY_MS = 30_000;
const WEBHOOK_POLL_INTERVAL_MS = 2000; // 2s between delivery batches
const WEBHOOK_UNSTICK_INTERVAL_MS = 60_000; // 1min
const WEBHOOK_BATCH_SIZE = 25;

function getConcurrency(): number {
  const raw = Number(process.env.WORKER_CONCURRENCY);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_CONCURRENCY;
}

/**
 * Starts Graphile Worker in the current process, plus:
 *   - a 2s poll loop that drains the partner `webhook_delivery` queue
 *   - an hourly sweep that cleans up abandoned partner provisions and
 *     expired idempotency keys
 *
 * Safe to call from the server — all background work is non-blocking.
 */
export function startWorker() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[worker] DATABASE_URL not set, skipping worker start");
    return;
  }

  const concurrency = getConcurrency();

  run({
    connectionString,
    concurrency,
    noHandleSignals: true,
    taskList: {
      "translations.run": translationRunTask,
      "onboarding.import": onboardingImportTask,
      "partner.cleanup-abandoned-provisions":
        partnerCleanupAbandonedProvisionsTask,
      "partner.purge-idempotency-keys": partnerPurgeIdempotencyKeysTask,
    },
  })
    .then((runner) => {
      console.info(
        `[worker] Graphile Worker started (concurrency=${concurrency})`
      );
      runner.promise.catch((error) => {
        console.error("[worker] Graphile Worker crashed:", error);
      });
    })
    .catch((error) => {
      console.error("[worker] Failed to start Graphile Worker:", error);
    });

  schedulePeriodicPartnerCleanup();
  scheduleWebhookDeliveryLoop();
}

/**
 * Periodic executor for jobs that don't need a queue — they just need to run
 * on a schedule. Graphile-worker supports cron via a crontab file, but for
 * two hourly jobs setInterval inside the worker process is simpler.
 */
function schedulePeriodicPartnerCleanup() {
  const runBoth = async () => {
    try {
      await partnerCleanupAbandonedProvisionsTask(
        undefined as unknown as never,
        undefined as unknown as never
      );
    } catch (error) {
      console.error("[partner-cleanup] abandonment sweep failed:", error);
    }
    try {
      await partnerPurgeIdempotencyKeysTask(
        undefined as unknown as never,
        undefined as unknown as never
      );
    } catch (error) {
      console.error("[partner-cleanup] idempotency purge failed:", error);
    }
  };

  // Kick off once shortly after start so errors surface early, then hourly.
  setTimeout(() => {
    runBoth();
  }, PARTNER_CLEANUP_STARTUP_DELAY_MS);
  setInterval(() => {
    runBoth();
  }, PARTNER_CLEANUP_INTERVAL_MS).unref();
}

/**
 * Poll loop for outbound webhook delivery. Runs in the same process as the
 * graphile worker for simplicity; split out to a dedicated process later if
 * throughput demands it.
 */
function scheduleWebhookDeliveryLoop() {
  let running = false;
  const tick = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await processBatch(WEBHOOK_BATCH_SIZE);
    } catch (error) {
      console.error("[webhooks] delivery batch failed:", error);
    } finally {
      running = false;
    }
  };

  setInterval(() => {
    tick();
  }, WEBHOOK_POLL_INTERVAL_MS).unref();

  // Periodically unstick deliveries abandoned mid-attempt (e.g. after a crash).
  setInterval(() => {
    unstickStaleDelivering().catch((error) => {
      console.error("[webhooks] unstick sweep failed:", error);
    });
  }, WEBHOOK_UNSTICK_INTERVAL_MS).unref();
}
