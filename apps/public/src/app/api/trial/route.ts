import { Client } from "@notionhq/client";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_CRM_DATABASE_ID = process.env.NOTION_CRM_DATABASE_ID;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!(NOTION_API_KEY && NOTION_CRM_DATABASE_ID)) {
  console.warn(
    "[api/trial] Missing NOTION_API_KEY or NOTION_CRM_DATABASE_ID. Submissions will be rejected until these are set."
  );
}

const notion = NOTION_API_KEY ? new Client({ auth: NOTION_API_KEY }) : null;

const NOTION_SOURCE_MAP: Record<string, string> = {
  "Pubblicità online (es. Instagram Ads, Google Ads, etc.)":
    "Pubblicità online",
  "Social Media (Facebook, Instagram, etc.)": "Social Media",
};

const MAX_TEXT_LENGTH = 200;
const MAX_PHONE_LENGTH = 32;

function normalizeText(value: unknown, max = MAX_TEXT_LENGTH): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isSameOrigin(request: NextRequest): boolean {
  // Dev servers, preview URLs, and local tooling use variable hostnames.
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const origin = request.headers.get("origin");
  // Vercel and most proxies set x-forwarded-host to the public hostname the
  // client actually hit; fall back to Host if absent.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!(origin && host)) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origine non consentita." },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`trial:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Troppe richieste. Riprova fra qualche minuto.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  if (!(notion && NOTION_CRM_DATABASE_ID)) {
    return NextResponse.json(
      { success: false, error: "Servizio temporaneamente non disponibile." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Richiesta non valida." },
      { status: 400 }
    );
  }

  // Honeypot: real users can't fill a hidden field. Pretend success so bots
  // don't retry, but never touch Notion or Slack.
  if (normalizeText(body.website)) {
    return NextResponse.json({ success: true });
  }

  const businessName = normalizeText(body.businessName);
  const fullName = normalizeText(body.fullName);
  const phone = normalizeText(body.phone, MAX_PHONE_LENGTH);
  const province = normalizeText(body.province, 64);
  const source = normalizeText(body.source, 128);

  if (!(businessName && fullName && phone && province)) {
    return NextResponse.json(
      {
        success: false,
        error: "Tutti i campi obbligatori devono essere compilati.",
      },
      { status: 400 }
    );
  }

  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed?.isValid()) {
    return NextResponse.json(
      { success: false, error: "Numero di telefono non valido." },
      { status: 400 }
    );
  }
  const formattedPhone = parsed.formatInternational();

  const notionSource = source
    ? (NOTION_SOURCE_MAP[source] ?? source.replaceAll(",", ""))
    : "";

  const properties: Record<string, unknown> = {
    Titolare: { title: [{ text: { content: fullName } }] },
    Attività: { rich_text: [{ text: { content: businessName } }] },
    Status: { status: { name: "Lead" } },
    Telefono: { phone_number: formattedPhone },
    Provincia: { rich_text: [{ text: { content: province } }] },
    "Data di Registrazione": {
      date: { start: new Date().toISOString().split("T")[0] },
    },
    Fonte: { select: { name: "Landing Form" } },
  };

  if (notionSource) {
    properties["Come hai scoperto Avo?"] = { select: { name: notionSource } };
  }

  try {
    await notion.pages.create({
      parent: { database_id: NOTION_CRM_DATABASE_ID },
      // biome-ignore lint/suspicious/noExplicitAny: Notion property union is too wide to type inline.
      properties: properties as any,
    });
  } catch (err) {
    console.error("[api/trial] Notion create failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Errore durante la registrazione. Riprova.",
      },
      { status: 500 }
    );
  }

  // Webhooks are awaited so we observe failures, but they don't fail the submit
  // — the lead is already persisted in Notion.
  const sideEffects: Promise<unknown>[] = [];

  if (SLACK_WEBHOOK_URL) {
    sideEffects.push(
      fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "Nuovo contatto dal sito!" },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Titolare:*\n${fullName}` },
                { type: "mrkdwn", text: `*Attività:*\n${businessName}` },
                { type: "mrkdwn", text: `*Telefono:*\n${formattedPhone}` },
                { type: "mrkdwn", text: `*Provincia:*\n${province}` },
                ...(source
                  ? [{ type: "mrkdwn", text: `*Fonte:*\n${source}` }]
                  : []),
              ],
            },
          ],
        }),
      }).then((r) => {
        if (!r.ok) {
          throw new Error(`Slack responded ${r.status}`);
        }
      })
    );
  }

  // NOTE: Server-side Meta Conversions API call was removed. The previous
  // implementation trusted a client-sent `cookieConsent` boolean and put the
  // access token in the URL. Re-introduce it only with (a) a first-party
  // cookie read server-side for consent, (b) `access_token` in the POST body,
  // and (c) a shared `event_id` with the client pixel for deduplication.

  const results = await Promise.allSettled(sideEffects);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[api/trial] side-effect failed:", r.reason);
    }
  }

  return NextResponse.json({ success: true });
}
