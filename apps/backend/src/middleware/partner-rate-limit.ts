import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

/**
 * In-memory fixed-window rate limiter keyed by a string.
 *
 * Intentionally process-local: fine for a single Railway instance.
 * When we scale out we swap the store for a Redis-backed implementation
 * behind the same interface (`RateLimitStore`).
 */
interface RateLimitStore {
  /**
   * Records a hit, returns the current count and when the window resets
   * (epoch seconds).
   */
  hit(key: string, windowSeconds: number): { count: number; resetAt: number };
}

interface WindowEntry {
  count: number;
  resetAt: number; // epoch seconds
}

const store = new Map<string, WindowEntry>();

const inMemoryStore: RateLimitStore = {
  hit(key, windowSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const existing = store.get(key);
    if (!existing || existing.resetAt <= now) {
      const entry: WindowEntry = { count: 1, resetAt: now + windowSeconds };
      store.set(key, entry);
      return { count: 1, resetAt: entry.resetAt };
    }
    existing.count += 1;
    return { count: existing.count, resetAt: existing.resetAt };
  },
};

/** Sweeps expired windows every 5 minutes to prevent unbounded growth. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, SWEEP_INTERVAL_MS).unref();

export interface RateLimitConfig {
  /** Per-partner limit. Default 600 requests / minute. */
  partnerPerMinute?: number;
  /** Per-venue limit. Default 100 requests / minute. */
  venuePerMinute?: number;
}

const DEFAULTS: Required<RateLimitConfig> = {
  partnerPerMinute: 600,
  venuePerMinute: 100,
};

/**
 * Enforces rate limits for partner requests.
 * Must run after `requirePartner()` (uses `c.get("partner")`).
 * Venue-scoped limits only engage if `c.get("venueLink")` is set — typically
 * from `requireVenueLink()`.
 */
export const partnerRateLimit = (config: RateLimitConfig = {}) => {
  const { partnerPerMinute, venuePerMinute } = { ...DEFAULTS, ...config };

  return createMiddleware(async (c, next) => {
    const partnerRow = c.get("partner");
    if (!partnerRow) {
      // Middleware used incorrectly; bail loudly.
      throw new HTTPException(500, {
        message: "partnerRateLimit used without requirePartner",
      });
    }

    // Partner-level bucket.
    const partnerKey = `partner:${partnerRow.id}`;
    const partnerHit = inMemoryStore.hit(partnerKey, 60);

    if (partnerHit.count > partnerPerMinute) {
      const retryAfter = partnerHit.resetAt - Math.floor(Date.now() / 1000);
      return rateLimited(c, retryAfter, partnerPerMinute, partnerHit.resetAt);
    }
    setRateLimitHeaders(
      c,
      partnerPerMinute,
      Math.max(0, partnerPerMinute - partnerHit.count),
      partnerHit.resetAt
    );

    // Venue-level bucket (if the route is venue-scoped).
    const venueLink = c.get("venueLink");
    if (venueLink) {
      const venueKey = `partner:${partnerRow.id}:venue:${venueLink.venueId}`;
      const venueHit = inMemoryStore.hit(venueKey, 60);
      if (venueHit.count > venuePerMinute) {
        const retryAfter = venueHit.resetAt - Math.floor(Date.now() / 1000);
        return rateLimited(c, retryAfter, venuePerMinute, venueHit.resetAt);
      }
    }

    await next();
  });
};

function rateLimited(
  c: Parameters<Parameters<typeof createMiddleware>[0]>[0],
  retryAfterSeconds: number,
  limit: number,
  resetAt: number
) {
  c.header("Retry-After", String(Math.max(1, retryAfterSeconds)));
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", "0");
  c.header("X-RateLimit-Reset", String(resetAt));
  return c.json(
    {
      error: {
        code: "rate_limited",
        message: "Too many requests. See Retry-After header.",
      },
    },
    429
  );
}

function setRateLimitHeaders(
  c: Parameters<Parameters<typeof createMiddleware>[0]>[0],
  limit: number,
  remaining: number,
  resetAt: number
) {
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(resetAt));
}

/** Exported for tests that want to reset state between cases. */
export function __resetRateLimitStore() {
  store.clear();
}
