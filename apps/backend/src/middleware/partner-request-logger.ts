import { createMiddleware } from "hono/factory";

/**
 * Structured request logger for partner API calls.
 *
 * Emits one JSON line per request on stdout so they can be scraped by your
 * log aggregator (Railway, Datadog, Loki, etc.). Only applied to `/api/partner`
 * routes so it doesn't pollute the dashboard/manage logs.
 *
 * Fields:
 *   - level:         "info" on 2xx/3xx, "warn" on 4xx, "error" on 5xx
 *   - event:         "partner_request"
 *   - request_id:    short random id, also echoed in response header
 *   - partner_slug:  (if authenticated) the partner's slug
 *   - venue_id:      (if venue-scoped) the venue id
 *   - method, path, status, latency_ms
 *   - idempotency_key, user_agent
 */
export const partnerRequestLogger = createMiddleware(async (c, next) => {
  const startedAt = Date.now();
  const requestId = shortRequestId();

  c.header("X-Request-Id", requestId);

  try {
    await next();
  } finally {
    const latencyMs = Date.now() - startedAt;
    const status = c.res.status;

    const partnerRow = safeGet(c, "partner") as
      | { slug?: string; id?: string }
      | undefined;
    const venueLink = safeGet(c, "venueLink") as
      | { venueId?: string }
      | undefined;

    const line = {
      level: logLevelForStatus(status),
      event: "partner_request",
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      latency_ms: latencyMs,
      partner_slug: partnerRow?.slug,
      venue_id: venueLink?.venueId,
      idempotency_key: c.req.header("idempotency-key") ?? undefined,
      user_agent: c.req.header("user-agent") ?? undefined,
      timestamp: new Date().toISOString(),
    };
    console.info(JSON.stringify(line));
  }
});

function logLevelForStatus(status: number): "info" | "warn" | "error" {
  if (status >= 500) {
    return "error";
  }
  if (status >= 400) {
    return "warn";
  }
  return "info";
}

function shortRequestId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  // URL-safe base64 → prefixed so it's recognizable in grep.
  return `req_${Buffer.from(bytes).toString("base64url")}`;
}

function safeGet(
  c: Parameters<Parameters<typeof createMiddleware>[0]>[0],
  key: string
): unknown {
  try {
    return (c as unknown as { get: (k: string) => unknown }).get(key);
  } catch {
    return;
  }
}
