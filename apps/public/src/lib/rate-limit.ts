// Fixed-window per-key rate limiter. In-memory, best-effort.
// Works per instance: behind multi-region serverless it's not globally enforced.
// Upgrade to Upstash/Arcjet when you need strict guarantees.

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_ENTRIES = 10_000;
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (buckets.size > MAX_ENTRIES) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) {
        buckets.delete(k);
      }
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) {
    return xri.trim();
  }
  return "unknown";
}
