/**
 * Public JSON API helper.
 *
 * Uses an empty base URL → relative requests that flow through Next.js
 * rewrites to the backend. This works in both dev and prod without code
 * changes; the actual backend host is configured at the framework level.
 *
 * Throws on non-OK so React Query's error path engages (no special body
 * shape required — the public menu endpoints return either `{ data: ... }`
 * or `{ error: { ... } }`, and 4xx/5xx are surfaced as thrown Errors).
 */
export async function fetchPublicJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (res.ok) {
    return (await res.json()) as T;
  }

  let message = `Request failed (${res.status})`;
  try {
    const data = await res.clone().json();
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error: unknown }).error;
      if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object" && "message" in err) {
        const m = (err as { message?: unknown }).message;
        if (typeof m === "string") {
          message = m;
        }
      }
    }
  } catch {
    // Body wasn't JSON — keep the default message.
  }
  throw new Error(message);
}
