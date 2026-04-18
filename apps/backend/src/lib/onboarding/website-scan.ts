import { z } from "zod";
import { aiService } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebsiteScanResult {
  normalizedUrl: string;
  title: string | null;
  logoUrl: string | null;
  menuImageUrls: string[];
  menuDocumentUrls: string[];
  theme: Record<string, string>;
  branding: {
    brandName: string | null;
    tagline: string | null;
    summary: string | null;
    toneKeywords: string[];
    styleKeywords: string[];
  };
}

// ---------------------------------------------------------------------------
// Constants & patterns
// ---------------------------------------------------------------------------

const MENU_PATTERN =
  /men[uù]|carta|food|drink|cocktail|wine|bevande|listino|ristorante/i;
const LOGO_PATTERN = /logo|brand|header/i;
const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const TITLE_PATTERN = /<title[^>]*>([\s\S]*?)<\/title>/i;
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|webp|gif)$/i;
const PDF_PATTERN = /\.pdf($|\?)/i;
const FETCH_TIMEOUT_MS = 7000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AvoMenuBot/1.0; +https://avomenu.com)";

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

const PROTOCOL_PATTERN = /^https?:\/\//i;

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Please provide a valid website URL");
  }
  return PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippet(html: string, max = 1600): string {
  return stripTags(html).slice(0, max);
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  for (const match of tag.matchAll(attrPattern)) {
    const name = match[1]?.toLowerCase();
    if (!name || name === tag.slice(1, tag.indexOf(" ")).toLowerCase()) {
      continue;
    }
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attrs;
}

function resolveUrl(baseUrl: string, candidate?: string | null): string | null {
  if (!candidate) {
    return null;
  }
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

function normalizeHex(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!COLOR_PATTERN.test(trimmed)) {
    return null;
  }
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Meta / title extraction
// ---------------------------------------------------------------------------

function extractMeta(
  html: string,
  key: string,
  attr: "name" | "property" = "property"
): string | null {
  const pattern = new RegExp(
    `<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  const match = html.match(pattern);
  return match?.[1] ?? match?.[2] ?? null;
}

function extractTitle(html: string): string | null {
  const match = html.match(TITLE_PATTERN);
  return match ? stripTags(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function extractManifestHref(html: string, baseUrl: string): string | null {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    if ((attrs.rel ?? "").toLowerCase().includes("manifest")) {
      return resolveUrl(baseUrl, attrs.href);
    }
  }
  return null;
}

async function fetchManifest(
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Logo extraction
// ---------------------------------------------------------------------------

function extractLogoCandidates(html: string, baseUrl: string): string[] {
  const metaCandidates = [
    resolveUrl(baseUrl, extractMeta(html, "og:logo")),
    resolveUrl(baseUrl, extractMeta(html, "og:image")),
    resolveUrl(baseUrl, extractMeta(html, "twitter:image", "name")),
  ];

  const imageCandidates: Array<string | null> = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    const signal = `${attrs.alt ?? ""} ${attrs.class ?? ""} ${attrs.id ?? ""} ${attrs.src ?? ""}`;
    if (LOGO_PATTERN.test(signal)) {
      imageCandidates.push(resolveUrl(baseUrl, attrs.src));
    }
  }

  const iconCandidates: Array<string | null> = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    const rel = (attrs.rel ?? "").toLowerCase();
    if (rel.includes("icon") || rel.includes("apple-touch-icon")) {
      iconCandidates.push(resolveUrl(baseUrl, attrs.href));
    }
  }

  return unique([
    ...metaCandidates,
    ...imageCandidates,
    ...iconCandidates,
  ]).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Menu asset extraction
// ---------------------------------------------------------------------------

function classifyMenuLink(
  href: string,
  pageLinks: string[],
  imageUrls: string[],
  documentUrls: string[]
) {
  if (IMAGE_EXT_PATTERN.test(href)) {
    imageUrls.push(href);
  } else if (PDF_PATTERN.test(href)) {
    documentUrls.push(href);
  } else {
    pageLinks.push(href);
  }
}

function extractMenuImageCandidates(
  html: string,
  baseUrl: string,
  imageUrls: string[]
) {
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    const signal = `${attrs.alt ?? ""} ${attrs.class ?? ""} ${attrs.id ?? ""} ${attrs.src ?? ""}`;
    if (MENU_PATTERN.test(signal)) {
      const imageUrl = resolveUrl(baseUrl, attrs.src);
      if (imageUrl) {
        imageUrls.push(imageUrl);
      }
    }
  }
}

function extractMenuAssets(html: string, baseUrl: string) {
  const pageLinks: string[] = [];
  const imageUrls: string[] = [];
  const documentUrls: string[] = [];

  for (const match of html.matchAll(
    /<a\b[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi
  )) {
    const attrs = parseAttrs(match[0]);
    const href = resolveUrl(baseUrl, attrs.href);
    const text = stripTags(match[1] ?? "");
    const signal = `${attrs.href ?? ""} ${text}`.toLowerCase();
    if (!(href && MENU_PATTERN.test(signal))) {
      continue;
    }

    classifyMenuLink(href, pageLinks, imageUrls, documentUrls);
  }

  extractMenuImageCandidates(html, baseUrl, imageUrls);

  return {
    pageLinks: unique(pageLinks).slice(0, 4),
    imageUrls: unique(imageUrls),
    documentUrls: unique(documentUrls),
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchText(url: string): Promise<{ url: string; html: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Website returned status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !(
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml")
      )
    ) {
      throw new Error("Website did not return a readable HTML page");
    }

    return { url: response.url, html: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

function filterUrls(
  chosen: string[] | undefined,
  allowed: Set<string>
): string[] {
  if (!chosen) {
    return [];
  }
  return unique(chosen).filter((url) => allowed.has(url));
}

// ---------------------------------------------------------------------------
// AI schema for website analysis
// ---------------------------------------------------------------------------

const websiteScanDecisionSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  menuImageUrls: z.array(z.string()).optional(),
  menuDocumentUrls: z.array(z.string()).optional(),
  primaryColor: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  toneKeywords: z.array(z.string()).optional(),
  styleKeywords: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Candidate gathering helpers
// ---------------------------------------------------------------------------

interface PageSummary {
  url: string;
  title: string | null;
  snippet: string;
  assets: ReturnType<typeof extractMenuAssets>;
}

function gatherColorCandidates(
  html: string,
  manifest: Record<string, unknown> | null
): string[] {
  return unique([
    normalizeHex(extractMeta(html, "theme-color", "name")),
    normalizeHex(extractMeta(html, "msapplication-TileColor", "name")),
    normalizeHex(
      typeof manifest?.theme_color === "string"
        ? manifest.theme_color
        : undefined
    ),
    normalizeHex(
      typeof manifest?.background_color === "string"
        ? manifest.background_color
        : undefined
    ),
  ]);
}

function buildTheme(
  ai: {
    primaryColor?: string | null;
    backgroundColor?: string | null;
    accentColor?: string | null;
  },
  allowedColors: Set<string>
): Record<string, string> {
  const primaryColor = normalizeHex(ai.primaryColor);
  const backgroundColor = normalizeHex(ai.backgroundColor);
  const accentColor = normalizeHex(ai.accentColor);

  const theme: Record<string, string> = {};
  if (primaryColor && allowedColors.has(primaryColor)) {
    theme.primaryColor = primaryColor;
  }
  if (backgroundColor && allowedColors.has(backgroundColor)) {
    theme.backgroundColor = backgroundColor;
  }
  if (accentColor && allowedColors.has(accentColor)) {
    theme.accentColor = accentColor;
  } else if (theme.backgroundColor) {
    theme.accentColor = theme.backgroundColor;
  } else if (theme.primaryColor) {
    theme.accentColor = theme.primaryColor;
  }
  return theme;
}

// ---------------------------------------------------------------------------
// Main scan function
// ---------------------------------------------------------------------------

export async function scanRestaurantWebsite(
  website: string
): Promise<WebsiteScanResult> {
  const normalizedUrl = normalizeUrl(website);
  const homepage = await fetchText(normalizedUrl);
  const manifestHref = extractManifestHref(homepage.html, homepage.url);
  const manifest = manifestHref ? await fetchManifest(manifestHref) : null;

  const homepageAssets = extractMenuAssets(homepage.html, homepage.url);

  // Fetch linked pages in parallel
  const linkedPages = await Promise.all(
    homepageAssets.pageLinks.map(async (url) => {
      try {
        return await fetchText(url);
      } catch {
        return null;
      }
    })
  );

  const linkedPageSummaries: PageSummary[] = linkedPages
    .filter((page): page is { url: string; html: string } => page !== null)
    .map((page) => ({
      url: page.url,
      title: extractTitle(page.html),
      snippet: snippet(page.html, 1200),
      assets: extractMenuAssets(page.html, page.url),
    }));

  // Gather candidates
  const logoCandidates = unique([
    ...extractLogoCandidates(homepage.html, homepage.url),
    ...(manifest?.icons && Array.isArray(manifest.icons)
      ? [
          resolveUrl(
            homepage.url,
            (manifest.icons as Record<string, unknown>[])[0]?.src as
              | string
              | undefined
          ),
        ]
      : []),
  ]);

  const menuImageCandidates = unique([
    ...homepageAssets.imageUrls,
    ...linkedPageSummaries.flatMap((p) => p.assets.imageUrls),
  ]).slice(0, 12);

  const menuDocumentCandidates = unique([
    ...homepageAssets.documentUrls,
    ...linkedPageSummaries.flatMap((p) => p.assets.documentUrls),
  ]).slice(0, 12);

  const colorCandidates = gatherColorCandidates(homepage.html, manifest);

  // AI analysis
  const ai = await aiService.generateObject({
    model:
      process.env.OPENROUTER_WEBSITE_SCAN_MODEL ?? "google/gemini-2.5-flash",
    schema: websiteScanDecisionSchema,
    providerOptions: {
      openrouter: {
        plugins: [{ id: "response-healing" }],
      },
    },
    system:
      "You analyze restaurant websites. Choose the most likely brand logo, menu assets, brand colors, and branding signals from the provided website content and candidates only. Never invent URLs or colors. Brand descriptions must be concise and grounded in the provided text.",
    prompt: JSON.stringify({
      siteUrl: homepage.url,
      homepageTitle: extractTitle(homepage.html),
      homepageSnippet: snippet(homepage.html),
      homepageMenuLinks: homepageAssets.pageLinks,
      linkedPages: linkedPageSummaries.map((page) => ({
        url: page.url,
        title: page.title,
        snippet: page.snippet,
        menuImages: page.assets.imageUrls,
        menuDocuments: page.assets.documentUrls,
      })),
      candidates: {
        logoUrls: logoCandidates,
        menuImageUrls: menuImageCandidates,
        menuDocumentUrls: menuDocumentCandidates,
        colors: colorCandidates,
      },
    }),
  });

  // Validate AI choices against known candidates
  const allowedLogos = new Set(logoCandidates);
  const allowedImages = new Set(menuImageCandidates);
  const allowedDocuments = new Set(menuDocumentCandidates);

  const chosenLogo =
    ai.logoUrl && allowedLogos.has(ai.logoUrl)
      ? ai.logoUrl
      : (logoCandidates[0] ?? null);

  return {
    normalizedUrl: homepage.url,
    title: extractTitle(homepage.html),
    logoUrl: chosenLogo,
    menuImageUrls: filterUrls(ai.menuImageUrls, allowedImages),
    menuDocumentUrls: filterUrls(ai.menuDocumentUrls, allowedDocuments),
    theme: buildTheme(ai, new Set(colorCandidates)),
    branding: {
      brandName: ai.brandName?.trim() || extractTitle(homepage.html),
      tagline: ai.tagline?.trim() || null,
      summary: ai.summary?.trim() || null,
      toneKeywords: unique(ai.toneKeywords ?? []).slice(0, 5),
      styleKeywords: unique(ai.styleKeywords ?? []).slice(0, 5),
    },
  };
}
