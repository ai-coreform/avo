/**
 * Cursor pagination helpers for partner list endpoints.
 *
 * Cursors are opaque base64 strings that encode `{ createdAt, id }` so that
 * results can continue deterministically even when rows are created while
 * iterating.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

export interface DecodedCursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(cursor: DecodedCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor(raw: string): DecodedCursor | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof (parsed as DecodedCursor).createdAt === "string" &&
      typeof (parsed as DecodedCursor).id === "string"
    ) {
      return parsed as DecodedCursor;
    }
    return null;
  } catch {
    return null;
  }
}

/** Clamp a requested `limit` value to the configured range. */
export function normalizeLimit(raw: number | undefined): number {
  if (!(raw && Number.isFinite(raw)) || raw <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(raw), MAX_PAGE_SIZE);
}
