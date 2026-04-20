/**
 * The base domain where customer-facing menus are served (e.g. "avomenu.com").
 * Set via NEXT_PUBLIC_MENU_DOMAIN; defaults to "avomenu.com".
 */
export const MENU_DOMAIN = process.env.NEXT_PUBLIC_MENU_DOMAIN ?? "avomenu.com";

/** Full menu URL for a given org slug */
export function menuUrl(orgSlug: string) {
  return `https://menu.${MENU_DOMAIN}/${orgSlug}`;
}
