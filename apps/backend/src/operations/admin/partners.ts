import { password } from "bun";
import { eq } from "drizzle-orm";
import database from "@/db";
import { partner } from "@/db/schema/partner";

/**
 * Partner credential lifecycle operations.
 *
 * Used by both:
 *  - `/api/admin/partners` routes (admin UI)
 *  - `scripts/seed-partner.ts` (CLI bootstrap fallback)
 *
 * Plaintext secrets are returned ONCE from create/rotate/revoke ops. After
 * they leave this function the DB only holds the bcrypt hash of the API key
 * and the raw webhook secret (needed for HMAC signing).
 */

const CHAR_POOL =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const API_KEY_RANDOM_CHARS = 48;
const WEBHOOK_SECRET_RANDOM_CHARS = 48;
const BCRYPT_COST = 10;
const ROTATION_OVERLAP_HOURS = 24;

export type Environment = "live" | "staging";

export interface CreatePartnerInput {
  slug: string;
  name: string;
  webhookUrl: string;
  ipAllowlist?: string[];
  environment?: Environment;
}

export interface PartnerCredentials {
  apiKey: string;
  webhookSecret: string;
}

export interface CreatedPartner {
  partner: typeof partner.$inferSelect;
  credentials: PartnerCredentials;
}

export interface RotatedPartner {
  partner: typeof partner.$inferSelect;
  apiKey: string;
  overlapExpiresAt: Date | null;
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────

export async function createPartner(
  input: CreatePartnerInput
): Promise<
  | { ok: true; result: CreatedPartner }
  | { ok: false; code: "slug_conflict"; message: string }
> {
  const [existing] = await database
    .select({ id: partner.id })
    .from(partner)
    .where(eq(partner.slug, input.slug))
    .limit(1);
  if (existing) {
    return {
      ok: false,
      code: "slug_conflict",
      message: `Partner with slug '${input.slug}' already exists.`,
    };
  }

  const environment = input.environment ?? detectEnvironment();
  const apiKey = generateApiKey(environment);
  const webhookSecret = generateWebhookSecret();
  const apiKeyHash = await password.hash(apiKey, {
    algorithm: "bcrypt",
    cost: BCRYPT_COST,
  });

  const [created] = await database
    .insert(partner)
    .values({
      slug: input.slug,
      name: input.name,
      apiKeyHash,
      webhookUrl: input.webhookUrl,
      webhookSecret,
      ipAllowlist: input.ipAllowlist ?? [],
      featureFlags: { allowProvisioning: true, allowSnapshot: true },
    })
    .returning();

  return {
    ok: true,
    result: {
      partner: created,
      credentials: { apiKey, webhookSecret },
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Rotate
// ──────────────────────────────────────────────────────────────

export interface RotatePartnerOptions {
  immediately?: boolean;
  environment?: Environment;
}

export async function rotatePartner(
  slug: string,
  options: RotatePartnerOptions = {}
): Promise<
  | { ok: true; result: RotatedPartner }
  | { ok: false; code: "not_found"; message: string }
> {
  const [existing] = await database
    .select()
    .from(partner)
    .where(eq(partner.slug, slug))
    .limit(1);
  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: `Partner '${slug}' not found.`,
    };
  }

  const environment = options.environment ?? detectEnvironment();
  const apiKey = generateApiKey(environment);
  const apiKeyHash = await password.hash(apiKey, {
    algorithm: "bcrypt",
    cost: BCRYPT_COST,
  });

  const overlapExpiresAt = options.immediately
    ? null
    : new Date(Date.now() + ROTATION_OVERLAP_HOURS * 60 * 60 * 1000);

  const [updated] = await database
    .update(partner)
    .set({
      apiKeyHash,
      apiKeyHashPrevious: options.immediately ? null : existing.apiKeyHash,
      apiKeyPreviousExpiresAt: overlapExpiresAt,
    })
    .where(eq(partner.id, existing.id))
    .returning();

  return {
    ok: true,
    result: {
      partner: updated,
      apiKey,
      overlapExpiresAt,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Update metadata (non-credential)
// ──────────────────────────────────────────────────────────────

export interface UpdatePartnerMetaInput {
  name?: string;
  webhookUrl?: string;
  ipAllowlist?: string[];
}

export async function updatePartnerMeta(
  slug: string,
  input: UpdatePartnerMetaInput
): Promise<
  | { ok: true; partner: typeof partner.$inferSelect }
  | { ok: false; code: "not_found"; message: string }
> {
  const [existing] = await database
    .select()
    .from(partner)
    .where(eq(partner.slug, slug))
    .limit(1);
  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: `Partner '${slug}' not found.`,
    };
  }

  const patch: Partial<typeof partner.$inferInsert> = {};
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.webhookUrl !== undefined) {
    patch.webhookUrl = input.webhookUrl;
  }
  if (input.ipAllowlist !== undefined) {
    patch.ipAllowlist = input.ipAllowlist;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true, partner: existing };
  }

  const [updated] = await database
    .update(partner)
    .set(patch)
    .where(eq(partner.id, existing.id))
    .returning();

  return { ok: true, partner: updated };
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export function generateApiKey(environment: Environment): string {
  const prefix = environment === "live" ? "avo_sk_live_" : "avo_sk_staging_";
  return `${prefix}${randomToken(API_KEY_RANDOM_CHARS)}`;
}

export function generateWebhookSecret(): string {
  return `avo_whsec_${randomToken(WEBHOOK_SECRET_RANDOM_CHARS)}`;
}

export function detectEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV ?? "";
  const appEnv = process.env.APP_ENV ?? "";
  if (nodeEnv === "production" && appEnv !== "staging") {
    return "live";
  }
  return "staging";
}

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHAR_POOL[bytes[i] % CHAR_POOL.length];
  }
  return out;
}
