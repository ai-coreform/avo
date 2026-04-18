import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config/environment";

interface ResolveResponse {
  data: {
    venueSlug: string;
    menuSlug: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  const { menuId } = await params;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/public/menu/resolve/${menuId}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return new NextResponse("Menu non trovato", { status: 404 });
    }

    const json = (await res.json()) as ResolveResponse;
    const { venueSlug, menuSlug } = json.data;

    const origin = _request.nextUrl.origin;
    const destination = `${origin}/m/${venueSlug}/${menuSlug}`;

    return NextResponse.redirect(destination, 302);
  } catch {
    return new NextResponse("Errore interno", { status: 500 });
  }
}
