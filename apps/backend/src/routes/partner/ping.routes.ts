import { Hono } from "hono";

/**
 * Trivial auth smoke-test endpoint.
 *
 * GET /api/partner/ping
 *
 * Returns the authenticated partner's slug + name. Used by Connect to verify
 * credentials before shipping to production.
 */
export const pingRoute = new Hono().get("/", (c) => {
  const partner = c.get("partner");
  return c.json({
    ok: true,
    partner: {
      slug: partner.slug,
      name: partner.name,
    },
    now: new Date().toISOString(),
  });
});
