import { and, eq, inArray } from "drizzle-orm";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";
import {
  buildClaimUrl,
  CLAIM_TOKEN_PREFIX,
  CLAIM_TOKEN_TTL_DAYS,
  claimToken,
} from "@/db/schema/claim-token";
import type { partner } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";
import { emitEventToPartner } from "@/operations/partner/webhooks/events";
import type { ProvisionBody } from "@/routes/partner/partner.schemas";
import { slugify } from "@/utils/slugify";

/**
 * Outcome of a provision call.
 */
export type ProvisionResult =
  | {
      kind: "created";
      avoVenueId: string;
      linkToken: string;
      claimUrl: string;
      claimExpiresAt: Date;
    }
  | {
      kind: "existing_pending_claim";
      avoVenueId: string;
      linkToken: string;
      claimUrl: string;
      claimExpiresAt: Date;
    }
  | {
      kind: "email_conflict";
      resolutionUrl: string;
    }
  | {
      kind: "already_provisioned";
    };

const VENUE_LINK_LIFETIME_MS = CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const TOKEN_RANDOM_BYTES = 32;
const CHAR_POOL =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHAR_POOL[bytes[i] % CHAR_POOL.length];
  }
  return out;
}

function generateLinkToken(): string {
  return `vlnk_${randomToken(TOKEN_RANDOM_BYTES)}`;
}

function generateClaimToken(): string {
  return `${CLAIM_TOKEN_PREFIX}${randomToken(TOKEN_RANDOM_BYTES)}`;
}

const TRAILING_SLASHES = /\/+$/;

function resolutionUrlForEmail(partnerSlug: string, email: string): string {
  const base = process.env.APP_URL ?? "https://app.avomenu.com";
  const u = new URL(
    `${base.replace(TRAILING_SLASHES, "")}/partners/${partnerSlug}/start`
  );
  u.searchParams.set("email", email);
  return u.toString();
}

async function findConflictingUser(email: string) {
  const [existingUser] = await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existingUser || existingUser.status !== "active") {
    return null;
  }

  // If the user has any venue membership, it's a real conflict. A pre-provisioned
  // user ("pending_claim") still blocks provisioning because we don't overwrite
  // their prior claim — but we checked `.status === "active"` above so that case
  // is excluded.
  const [existingMember] = await database
    .select({ venueId: member.venueId })
    .from(member)
    .where(and(eq(member.userId, existingUser.id), eq(member.isActive, true)))
    .limit(1);

  if (!existingMember) {
    return null;
  }

  return existingUser;
}

async function findExistingLinkForPartner(
  partnerId: string,
  connectVenueId: string
) {
  const [row] = await database
    .select()
    .from(venueLink)
    .where(
      and(
        eq(venueLink.partnerId, partnerId),
        eq(venueLink.connectVenueId, connectVenueId)
      )
    )
    .limit(1);
  return row ?? null;
}

async function refreshPendingClaim(opts: {
  linkId: string;
  userId: string;
  venueId: string;
}): Promise<{ linkToken: string; claimUrl: string; claimExpiresAt: Date }> {
  // Refresh the most recent claim for this link (extend expiry).
  const [link] = await database
    .select()
    .from(venueLink)
    .where(eq(venueLink.id, opts.linkId))
    .limit(1);
  if (!link) {
    throw new Error("venue_link vanished");
  }

  const newToken = generateClaimToken();
  const expiresAt = new Date(Date.now() + VENUE_LINK_LIFETIME_MS);

  // Mark any outstanding (unused) claims for this link as expired by setting used_at.
  // Simpler: delete stale ones and insert fresh.
  await database.insert(claimToken).values({
    token: newToken,
    userId: opts.userId,
    venueId: opts.venueId,
    venueLinkId: opts.linkId,
    expiresAt,
  });

  return {
    linkToken: link.linkToken,
    claimUrl: buildClaimUrl(newToken),
    claimExpiresAt: expiresAt,
  };
}

async function generateUniqueVenueSlug(baseSlug: string): Promise<string> {
  // Try baseSlug, then baseSlug-2, baseSlug-3, etc.
  let candidate = baseSlug;
  let attempt = 2;
  for (let i = 0; i < 50; i++) {
    const existing = await database
      .select({ id: venue.id })
      .from(venue)
      .where(eq(venue.slug, candidate))
      .limit(1);
    if (existing.length === 0) {
      return candidate;
    }
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
  return `${baseSlug}-${randomToken(6)}`;
}

/**
 * Provisions a new venue + pending user + venue link + claim token in one transaction.
 *
 * Idempotent on `(partner_id, connect_venue_id)` while pending_claim:
 * - If the prior link is already `active`, returns `already_provisioned` (409).
 * - If the prior link is `pending_claim`, extends the claim TTL and returns
 *   the same link_token plus a fresh claim URL.
 *
 * On email conflict (an active Avo user already owns this email elsewhere),
 * returns `email_conflict` with a resolution URL pointing to the classic
 * connect flow.
 */
export async function provisionVenue(
  partnerRow: typeof partner.$inferSelect,
  body: ProvisionBody
): Promise<ProvisionResult> {
  // 1) Check for existing link on this (partner, connect_venue_id).
  const existingLink = await findExistingLinkForPartner(
    partnerRow.id,
    body.connect_venue_id
  );

  if (existingLink?.status === "active") {
    return { kind: "already_provisioned" };
  }

  if (existingLink?.status === "pending_claim") {
    const refreshed = await refreshPendingClaim({
      linkId: existingLink.id,
      userId: await getUserIdForLink(existingLink.id),
      venueId: existingLink.venueId,
    });
    return {
      kind: "existing_pending_claim",
      avoVenueId: existingLink.venueId,
      linkToken: refreshed.linkToken,
      claimUrl: refreshed.claimUrl,
      claimExpiresAt: refreshed.claimExpiresAt,
    };
  }

  // 2) Email conflict check.
  const conflict = await findConflictingUser(body.owner.email);
  if (conflict) {
    return {
      kind: "email_conflict",
      resolutionUrl: resolutionUrlForEmail(partnerRow.slug, body.owner.email),
    };
  }

  // 3) Happy path: create everything in one transaction.
  const result = await database.transaction(async (tx) => {
    const venueSlug = await generateUniqueVenueSlug(slugify(body.venue.name));

    const [createdVenue] = await tx
      .insert(venue)
      .values({
        name: body.venue.name,
        slug: venueSlug,
        address: body.venue.address ?? null,
        country: body.venue.country,
        countryCode: body.venue.country,
        timezone: body.venue.timezone,
      })
      .returning();

    const [createdUser] = await tx
      .insert(user)
      .values({
        name: body.owner.name,
        email: body.owner.email,
        status: "pending_claim",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await tx.insert(member).values({
      userId: createdUser.id,
      venueId: createdVenue.id,
      role: "owner",
      isActive: true,
      createdAt: new Date(),
    });

    const linkTokenValue = generateLinkToken();
    const [createdLink] = await tx
      .insert(venueLink)
      .values({
        partnerId: partnerRow.id,
        venueId: createdVenue.id,
        linkToken: linkTokenValue,
        connectVenueId: body.connect_venue_id,
        status: "pending_claim",
      })
      .returning();

    const claimTokenValue = generateClaimToken();
    const claimExpiresAt = new Date(Date.now() + VENUE_LINK_LIFETIME_MS);

    await tx.insert(claimToken).values({
      token: claimTokenValue,
      userId: createdUser.id,
      venueId: createdVenue.id,
      venueLinkId: createdLink.id,
      expiresAt: claimExpiresAt,
    });

    return {
      avoVenueId: createdVenue.id,
      linkToken: linkTokenValue,
      claimUrl: buildClaimUrl(claimTokenValue),
      claimExpiresAt,
    };
  });

  return { kind: "created", ...result };
}

async function getUserIdForLink(venueLinkId: string): Promise<string> {
  // Newest not-used claim for this link → get user_id. If none, look up via member.
  const [newestClaim] = await database
    .select({ userId: claimToken.userId })
    .from(claimToken)
    .where(eq(claimToken.venueLinkId, venueLinkId))
    .orderBy(claimToken.createdAt)
    .limit(1);
  if (newestClaim) {
    return newestClaim.userId;
  }

  const [link] = await database
    .select({ venueId: venueLink.venueId })
    .from(venueLink)
    .where(eq(venueLink.id, venueLinkId))
    .limit(1);
  if (!link) {
    throw new Error("venue_link not found");
  }

  const [memberRow] = await database
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.venueId, link.venueId),
        inArray(member.role, ["owner", "admin"])
      )
    )
    .limit(1);
  if (!memberRow) {
    throw new Error("No owner found for venue");
  }
  return memberRow.userId;
}

/**
 * Revokes a venue link. Sets status to 'revoked' and disconnected_at.
 * Idempotent — calling twice is harmless.
 */
export async function revokeVenueLink(linkId: string): Promise<void> {
  const now = new Date();
  await database
    .update(venueLink)
    .set({ status: "revoked", disconnectedAt: now })
    .where(eq(venueLink.id, linkId));
}

/**
 * Cleanup: finds pending_claim venue_links whose claim token has expired and
 * marks them + associated user as abandoned. Run hourly from the worker.
 *
 * Returns the number of links marked abandoned.
 */
export async function cleanupAbandonedProvisions(): Promise<number> {
  const now = new Date();

  // Find (link, user) pairs where the link is still pending_claim and all
  // associated claim tokens are expired.
  const expired = await database
    .select({
      linkId: venueLink.id,
      partnerId: venueLink.partnerId,
      venueId: venueLink.venueId,
      connectVenueId: venueLink.connectVenueId,
      userId: claimToken.userId,
      expiresAt: claimToken.expiresAt,
    })
    .from(claimToken)
    .innerJoin(venueLink, eq(venueLink.id, claimToken.venueLinkId))
    .where(eq(venueLink.status, "pending_claim"));

  const abandoned: Array<{
    linkId: string;
    userId: string;
    partnerId: string;
    venueId: string;
    connectVenueId: string;
  }> = [];
  for (const row of expired) {
    if (row.expiresAt < now) {
      abandoned.push({
        linkId: row.linkId,
        userId: row.userId,
        partnerId: row.partnerId,
        venueId: row.venueId,
        connectVenueId: row.connectVenueId,
      });
    }
  }

  if (abandoned.length === 0) {
    return 0;
  }

  await database.transaction(async (tx) => {
    const linkIds = abandoned.map((a) => a.linkId);
    const userIds = abandoned.map((a) => a.userId);
    await tx
      .update(venueLink)
      .set({ status: "abandoned", disconnectedAt: now })
      .where(inArray(venueLink.id, linkIds));

    await tx
      .update(user)
      .set({ status: "abandoned" })
      .where(inArray(user.id, userIds));
  });

  // Emit provision.abandoned to each affected partner (no echo suppression
  // — partner wants to know their provisioning attempt timed out).
  for (const a of abandoned) {
    await emitEventToPartner({
      partnerId: a.partnerId,
      venueId: a.venueId,
      eventType: "provision.abandoned",
      resource: {
        type: "venue_link",
        connect_venue_id: a.connectVenueId,
      },
    });
  }

  return abandoned.length;
}

// Expose token generators for tests only.
export const __testing = {
  generateLinkToken,
  generateClaimToken,
};
