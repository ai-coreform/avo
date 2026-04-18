#!/usr/bin/env bun

/**
 * Production bootstrap CLI — creates a single superadmin user.
 *
 * This is intentionally minimal: no venue, no membership, no org linkage.
 * It writes exactly two rows — `user` (role=superadmin) and `account`
 * (providerId=credential, password hashed with better-auth/crypto).
 *
 * Usage:
 *
 *   bun run scripts/create-superadmin.ts
 *
 * Reads email, password (hidden) and name from an interactive prompt.
 * Refuses to overwrite an existing user with the same email.
 *
 * In production (NODE_ENV=production) the operator must type-confirm the
 * action before any rows are written.
 */

import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import database from "@/db";
import { account } from "@/db/schema/auth/account";
import { user } from "@/db/schema/auth/user";

const MIN_PASSWORD_LENGTH = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROD_CONFIRM_PHRASE = "CREATE SUPERADMIN IN PRODUCTION";

await main();
process.exit(0);

async function main() {
  const isProduction = process.env.NODE_ENV === "production";

  printBanner(isProduction);

  const rl = createInterface({ input, output });

  try {
    const name = await promptRequired(rl, "Name", validateName);
    const email = await promptRequired(rl, "Email", validateEmail);
    const password = await promptPassword(rl, "Password");
    await promptPasswordConfirmation(rl, password);

    if (isProduction) {
      await requireProdConfirmation(rl);
    }

    await assertEmailAvailable(email);

    const now = new Date();
    const hashed = await hashPassword(password);

    await database.transaction(async (tx) => {
      const [created] = await tx
        .insert(user)
        .values({
          name,
          email,
          emailVerified: true,
          role: "superadmin",
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: user.id });

      if (!created) {
        throw new Error("User insert returned no rows.");
      }

      await tx.insert(account).values({
        accountId: created.id,
        providerId: "credential",
        userId: created.id,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });
    });

    console.info("");
    console.info(
      `  ✓ Superadmin '${email}' created (environment: ${isProduction ? "production" : "non-production"}).`
    );
    console.info("");
  } finally {
    rl.close();
  }
}

// ──────────────────────────────────────────────────────────────
// Prompts
// ──────────────────────────────────────────────────────────────

async function promptRequired(
  rl: ReturnType<typeof createInterface>,
  label: string,
  validate: (raw: string) => string | null
): Promise<string> {
  while (true) {
    const raw = (await rl.question(`${label}: `)).trim();
    const error = validate(raw);
    if (error) {
      console.error(`  ✗ ${error}`);
      continue;
    }
    return raw;
  }
}

async function promptPassword(
  rl: ReturnType<typeof createInterface>,
  label: string
): Promise<string> {
  while (true) {
    const raw = await readHidden(rl, `${label}: `);
    const error = validatePassword(raw);
    if (error) {
      console.error(`  ✗ ${error}`);
      continue;
    }
    return raw;
  }
}

async function promptPasswordConfirmation(
  rl: ReturnType<typeof createInterface>,
  expected: string
): Promise<void> {
  while (true) {
    const again = await readHidden(rl, "Confirm password: ");
    if (again === expected) {
      return;
    }
    console.error("  ✗ Passwords do not match. Try again.");
  }
}

async function requireProdConfirmation(
  rl: ReturnType<typeof createInterface>
): Promise<void> {
  console.info("");
  console.info(
    "  ⚠  NODE_ENV=production. This will create a superadmin in the LIVE database."
  );
  console.info(`  Type exactly: ${PROD_CONFIRM_PHRASE}`);
  const typed = (await rl.question("> ")).trim();
  if (typed !== PROD_CONFIRM_PHRASE) {
    console.error("  ✗ Confirmation phrase did not match. Aborting.");
    process.exit(1);
  }
}

/**
 * Read a line from stdin without echoing keystrokes to stdout.
 * Works on any TTY by flipping readline's internal `_writeToOutput` to a no-op
 * while the user types. Non-TTY stdin (piped input) falls back to a normal
 * question, so automation still works.
 */
async function readHidden(
  rl: ReturnType<typeof createInterface>,
  prompt: string
): Promise<string> {
  if (!input.isTTY) {
    return (await rl.question(prompt)).trim();
  }

  // biome-ignore lint/suspicious/noExplicitAny: readline internals
  const rlWithInternals = rl as any;
  const originalWrite = rlWithInternals._writeToOutput?.bind(rlWithInternals);

  rlWithInternals._writeToOutput = (chunk: string) => {
    // Let the prompt label and newline through, silence everything else.
    if (chunk === prompt || chunk.includes("\n") || chunk.includes("\r")) {
      output.write(chunk);
    }
  };

  try {
    const answer = await rl.question(prompt);
    return answer.trim();
  } finally {
    if (originalWrite) {
      rlWithInternals._writeToOutput = originalWrite;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────

function validateName(raw: string): string | null {
  if (raw.length === 0) {
    return "Name is required.";
  }
  if (raw.length > 255) {
    return "Name must be 255 characters or fewer.";
  }
  return null;
}

function validateEmail(raw: string): string | null {
  if (raw.length === 0) {
    return "Email is required.";
  }
  if (!EMAIL_REGEX.test(raw)) {
    return "Email looks malformed.";
  }
  return null;
}

function validatePassword(raw: string): string | null {
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

async function assertEmailAvailable(email: string): Promise<void> {
  const existing = await database
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.error(
      `  ✗ A user with email '${email}' already exists. Aborting.\n` +
        "    This script refuses to overwrite. Promote via the admin UI or a dedicated script."
    );
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────
// Presentation
// ──────────────────────────────────────────────────────────────

function printBanner(isProduction: boolean) {
  const line = "─".repeat(60);
  console.info("");
  console.info(line);
  console.info("  create-superadmin");
  console.info(
    `  environment: ${isProduction ? "production (NODE_ENV=production)" : "non-production"}`
  );
  console.info(line);
  console.info("");
}
