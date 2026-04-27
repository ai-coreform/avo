import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config/environment";

interface ResolveResponse {
  data: {
    venueSlug: string;
    menuSlug: string;
  };
}

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
