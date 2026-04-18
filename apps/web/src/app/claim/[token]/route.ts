import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config/environment";

/**
 * GET /claim/:token
 *
 * The link Avo emails / embeds for a partner-provisioned owner.
 * Calls the backend claim endpoint, forwards the session cookie to the browser,
 * and redirects to the onboarding welcome screen.
 *
 * Failure modes (invalid/expired/used token) render an HTML error page.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  const res = await fetch(
    `${API_BASE_URL}/api/public/claim/${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        "user-agent": req.headers.get("user-agent") ?? "",
      },
      body: "{}",
      cache: "no-store",
      redirect: "manual",
    }
  );

  if (!res.ok) {
    const reason = await extractErrorCode(res);
    const url = new URL("/claim/error", req.nextUrl);
    url.searchParams.set("reason", reason);
    return NextResponse.redirect(url);
  }

  const body = (await res.json()) as { redirect_to?: string };
  const target = body.redirect_to ?? "/onboarding/welcome";

  const redirectUrl = new URL(target, req.nextUrl);
  redirectUrl.searchParams.set("first_claim", "1");

  const response = NextResponse.redirect(redirectUrl);

  // Forward every Set-Cookie header from the backend to the browser so the
  // session cookie is actually installed.
  for (const [name, value] of res.headers) {
    if (name.toLowerCase() === "set-cookie") {
      response.headers.append("Set-Cookie", value);
    }
  }

  return response;
}

async function extractErrorCode(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { code?: string };
    };
    return data.error?.code ?? `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}
