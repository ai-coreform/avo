#!/usr/bin/env bun
/**
 * Bootstrap CLI for managing partner credentials.
 *
 * Kept as a fallback for the very-first partner bootstrap before the admin UI
 * exists, and for emergency rotations during incidents. Day-to-day partner
 * management should happen via the admin UI at `/partners`.
 *
 * Usage:
 *
 *   bun run scripts/seed-partner.ts --slug connect --name Connect \
 *     --webhook-url https://api.connect.example/avo/webhook
 *   bun run scripts/seed-partner.ts --slug connect --rotate
 *   bun run scripts/seed-partner.ts --slug connect --revoke-immediately
 *   bun run scripts/seed-partner.ts --list
 */

import { parseArgs } from "node:util";
import database from "@/db";
import { partner } from "@/db/schema/partner";
import {
  createPartner,
  detectEnvironment,
  rotatePartner,
} from "@/operations/admin/partners";

// ──────────────────────────────────────────────────────────────
// Arg parsing
// ──────────────────────────────────────────────────────────────

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    slug: { type: "string" },
    name: { type: "string" },
    "webhook-url": { type: "string" },
    "ip-allowlist": { type: "string" },
    rotate: { type: "boolean", default: false },
    "revoke-immediately": { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  strict: true,
});

if (values.help) {
  printHelp();
  process.exit(0);
}

if (values.list) {
  await list();
  process.exit(0);
}

if (!values.slug) {
  console.error("Error: --slug is required (unless --list or --help).");
  process.exit(1);
}

if (values["revoke-immediately"]) {
  await runRotate(values.slug, { immediately: true });
  process.exit(0);
}

if (values.rotate) {
  await runRotate(values.slug, { immediately: false });
  process.exit(0);
}

if (!(values.name && values["webhook-url"])) {
  console.error(
    "Error: --name and --webhook-url are required when creating a partner."
  );
  process.exit(1);
}

await runCreate({
  slug: values.slug,
  name: values.name,
  webhookUrl: values["webhook-url"],
  ipAllowlist: parseCidrList(values["ip-allowlist"]),
});

process.exit(0);

// ──────────────────────────────────────────────────────────────
// Commands
// ──────────────────────────────────────────────────────────────

async function runCreate(opts: {
  slug: string;
  name: string;
  webhookUrl: string;
  ipAllowlist: string[];
}) {
  const result = await createPartner({
    slug: opts.slug,
    name: opts.name,
    webhookUrl: opts.webhookUrl,
    ipAllowlist: opts.ipAllowlist,
  });
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    console.error("  Hint: use --rotate to issue a new key.");
    process.exit(1);
  }

  printCredentials({
    action: "created",
    slug: opts.slug,
    apiKey: result.result.credentials.apiKey,
    webhookSecret: result.result.credentials.webhookSecret,
    environment: detectEnvironment(),
  });
}

async function runRotate(slug: string, opts: { immediately: boolean }) {
  const result = await rotatePartner(slug, { immediately: opts.immediately });
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }

  printCredentials({
    action: opts.immediately
      ? "rotated (immediate revoke — old key invalid)"
      : "rotated",
    slug,
    apiKey: result.result.apiKey,
    webhookSecret: null,
    environment: detectEnvironment(),
    overlapExpiresAt: result.result.overlapExpiresAt ?? undefined,
  });
}

async function list() {
  const rows = await database.select().from(partner);
  if (rows.length === 0) {
    console.info("No partners configured.");
    return;
  }
  console.info("\nConfigured partners (secrets hidden):");
  console.info("─".repeat(70));
  for (const row of rows) {
    console.info(`  slug:          ${row.slug}`);
    console.info(`  name:          ${row.name}`);
    console.info(`  webhook_url:   ${row.webhookUrl}`);
    console.info(
      `  ip_allowlist:  ${row.ipAllowlist.length > 0 ? row.ipAllowlist.join(", ") : "(any)"}`
    );
    console.info(`  feature_flags: ${JSON.stringify(row.featureFlags)}`);
    console.info(`  created_at:    ${row.createdAt.toISOString()}`);
    if (row.apiKeyHashPrevious) {
      console.info(
        `  rotation:      previous key valid until ${row.apiKeyPreviousExpiresAt?.toISOString()}`
      );
    }
    console.info("─".repeat(70));
  }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function parseCidrList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface CredentialsReport {
  action: string;
  slug: string;
  apiKey: string;
  webhookSecret: string | null;
  environment: "live" | "staging";
  overlapExpiresAt?: Date;
}

function printCredentials(report: CredentialsReport) {
  const banner = "═".repeat(72);
  console.info("");
  console.info(banner);
  console.info(
    `  Partner '${report.slug}' ${report.action} (environment: ${report.environment})`
  );
  console.info(banner);
  console.info("");
  console.info("  Copy these into your secure handoff channel IMMEDIATELY.");
  console.info("  They will not be shown again. There is no recovery.");
  console.info("");
  console.info(`  API Key:          ${report.apiKey}`);
  if (report.webhookSecret) {
    console.info(`  Webhook Secret:   ${report.webhookSecret}`);
  }
  if (report.overlapExpiresAt) {
    console.info(
      `  Old key valid until: ${report.overlapExpiresAt.toISOString()}`
    );
  }
  console.info("");
  console.info(banner);
  console.info("");
}

function printHelp() {
  console.info(`
seed-partner — bootstrap CLI for partner credentials (fallback for admin UI).

Usage:
  bun run scripts/seed-partner.ts --slug <slug> --name <name> --webhook-url <url> [--ip-allowlist "cidr1,cidr2"]
  bun run scripts/seed-partner.ts --slug <slug> --rotate
  bun run scripts/seed-partner.ts --slug <slug> --revoke-immediately
  bun run scripts/seed-partner.ts --list

Options:
  --slug                    Partner identifier slug (required except for --list).
  --name                    Human-readable partner name (required on create).
  --webhook-url             HTTPS URL Avo will POST webhooks to (required on create).
  --ip-allowlist            Comma-separated CIDRs allowed to call the partner API.
  --rotate                  Issue a new API key. Old key valid for 24h.
  --revoke-immediately      Issue a new API key and revoke the old one immediately.
  --list                    List configured partners (secrets hidden).
  --help                    Show this message.

For day-to-day partner management, prefer the admin UI at /partners.
`);
}
