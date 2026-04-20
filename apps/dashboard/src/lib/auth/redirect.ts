export const DEFAULT_AUTH_REDIRECT_PATH = "/";

const BLOCKED_REDIRECT_PREFIXES = ["/accedi", "/registrati"];

export function getSafeRedirectPath(redirectTo: string | null): string {
  if (!redirectTo) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (
    BLOCKED_REDIRECT_PREFIXES.some(
      (blockedPrefix) =>
        redirectTo === blockedPrefix ||
        redirectTo.startsWith(`${blockedPrefix}/`)
    )
  ) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return redirectTo;
}
