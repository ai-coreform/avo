import { type NextRequest, NextResponse } from "next/server";

interface ResolveResponse {
  data: {
    venueSlug: string;
    menuSlug: string;
  };
}

/**
 * QR redirect: a printed QR encodes `${PUBLIC_MENU_URL}/qr/v/{venueSlug}` so it
 * keeps working when the venue changes its active menu. We resolve to the
 * current active menu via the public backend endpoint, then 302 to it.
 *
 * Lives on the public app (not the dashboard) so the redirect lands on the
 * same origin the customer is already on — no cross-origin hop on scan.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueSlug: string }> }
) {
  const { venueSlug } = await params;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/public/menu/resolve-venue/${venueSlug}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return new NextResponse("Menu non trovato", { status: 404 });
    }

    const json = (await res.json()) as ResolveResponse;
    const { venueSlug: resolvedVenueSlug, menuSlug } = json.data;

    const origin = request.nextUrl.origin;
    const destination = `${origin}/m/${resolvedVenueSlug}/${menuSlug}`;

    return NextResponse.redirect(destination, 302);
  } catch {
    return new NextResponse("Errore interno", { status: 500 });
  }
}
