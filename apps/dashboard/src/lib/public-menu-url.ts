/**
 * Origin of the public menu app. Single source of truth for everywhere the
 * dashboard needs to reach customer-facing surfaces (preview iframe SRC,
 * postMessage `targetOrigin`, "open menu" links, printed-QR target).
 *
 * Defaults to localhost:3002 in dev; set `NEXT_PUBLIC_PUBLIC_MENU_URL` in
 * prod (e.g. "https://avomenu.com").
 *
 * The two apps are intentionally separate origins so the dashboard's auth
 * cookies never leak into customer-facing surfaces. Cross-origin postMessage
 * works the same as same-origin — we just have to be explicit about the
 * target instead of using a wildcard.
 */
export const PUBLIC_MENU_ORIGIN =
  process.env.NEXT_PUBLIC_PUBLIC_MENU_URL ?? "http://localhost:3002";

/** Absolute URL to a venue's menu on the public app. */
export function publicMenuUrl(venueSlug: string, menuSlug: string): string {
  return `${PUBLIC_MENU_ORIGIN}/m/${venueSlug}/${menuSlug}`;
}

/** Absolute URL to the QR redirect endpoint on the public app. */
export function publicMenuQrUrl(venueSlug: string): string {
  return `${PUBLIC_MENU_ORIGIN}/qr/v/${venueSlug}`;
}
