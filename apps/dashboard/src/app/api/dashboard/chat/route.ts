import type { NextRequest } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Streaming proxy for the chat endpoint.
 * Next.js rewrites buffer responses, which breaks SSE/streaming.
 * This route handler forwards the request and streams the response back.
 */
export async function POST(req: NextRequest) {
  const targetUrl = `${API_BASE}/api/dashboard/chat`;

  const headers = new Headers();
  // Forward auth cookies and content-type
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  // Forward transcription header
  const transcribeHeader = req.headers.get("x-avo-transcribe");
  if (transcribeHeader) {
    headers.set("x-avo-transcribe", transcribeHeader);
  }

  const upstream = await fetch(targetUrl, {
    method: "POST",
    headers,
    body: req.body,
    // @ts-expect-error -- Node fetch supports duplex for streaming request bodies
    duplex: "half",
  });

  // Stream the response through, preserving headers
  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("content-type", upstreamContentType);
  }

  // For SSE streams, set proper streaming headers
  if (upstreamContentType?.includes("text/event-stream")) {
    responseHeaders.set("cache-control", "no-cache");
    responseHeaders.set("connection", "keep-alive");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
