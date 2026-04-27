import { createMiddleware } from "hono/factory";

/**
 * Rate limiter for the public AI chat endpoint.
 *
 * Two buckets, AND'd together — exceeding either trips the limiter:
 * - per-IP: protects against scrapers and runaway clients
 * - per-venue: caps total spend at OpenRouter for any single venue
 *
 * Same in-memory fixed-window pattern as `partner-rate-limit.ts`. Process-local
 * (single Railway instance) — when we scale out, swap the store for Redis
 * behind the same shape.
 */

interface WindowEntry {
  count: number;
  resetAt: number; // epoch seconds
}

const store = new Map<string, WindowEntry>();

function hit(key: string, windowSeconds: number): WindowEntry {
  const now = Math.floor(Date.now() / 1000);
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const entry: WindowEntry = { count: 1, resetAt: now + windowSeconds };
    store.set(key, entry);
    return entry;
  }
  existing.count += 1;
  return existing;
}

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, SWEEP_INTERVAL_MS).unref();

export interface ChatRateLimitConfig {
  /** Window 1: per-IP. Default 30 messages / 10 minutes. */
  perIpLimit?: number;
  perIpWindowSeconds?: number;
  /** Window 2: per-venue. Default 200 messages / hour. */
  perVenueLimit?: number;
  perVenueWindowSeconds?: number;
}

const DEFAULTS: Required<ChatRateLimitConfig> = {
  perIpLimit: 30,
  perIpWindowSeconds: 600,
  perVenueLimit: 200,
  perVenueWindowSeconds: 3600,
};

function getClientIp(c: Parameters<Parameters<typeof createMiddleware>[0]>[0]) {
  // Trust the platform-set forwarding header (Railway, Vercel, Cloudflare all
  // populate this). If unset (local dev), fall back to a stable bucket.
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

/**
 * Mount on the public chat route. Reads `:venueSlug` from path params for the
 * per-venue bucket. The IP bucket uses the X-Forwarded-For header.
 */
export function chatRateLimit(config: ChatRateLimitConfig = {}) {
  const merged = { ...DEFAULTS, ...config };

  return createMiddleware(async (c, next) => {
    const venueSlug = c.req.param("venueSlug") ?? "unknown";
    const ip = getClientIp(c);

    const ipKey = `chat:ip:${ip}`;
    const ipEntry = hit(ipKey, merged.perIpWindowSeconds);
    if (ipEntry.count > merged.perIpLimit) {
      return rateLimited(c, ipEntry.resetAt, merged.perIpLimit, "ip");
    }

    const venueKey = `chat:venue:${venueSlug}`;
    const venueEntry = hit(venueKey, merged.perVenueWindowSeconds);
    if (venueEntry.count > merged.perVenueLimit) {
      return rateLimited(c, venueEntry.resetAt, merged.perVenueLimit, "venue");
    }

    setRateLimitHeaders(
      c,
      merged.perIpLimit,
      Math.max(0, merged.perIpLimit - ipEntry.count),
      ipEntry.resetAt
    );

    await next();
  });
}

function rateLimited(
  c: Parameters<Parameters<typeof createMiddleware>[0]>[0],
  resetAt: number,
  limit: number,
  scope: "ip" | "venue"
) {
  const retryAfter = Math.max(1, resetAt - Math.floor(Date.now() / 1000));
  c.header("Retry-After", String(retryAfter));
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", "0");
  c.header("X-RateLimit-Reset", String(resetAt));
  return c.json(
    {
      error: {
        code: "rate_limited",
        scope,
        message: "Hai inviato troppi messaggi. Riprova tra qualche minuto.",
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

/** Exported for tests. */
export function __resetChatRateLimitStore() {
  store.clear();
}
