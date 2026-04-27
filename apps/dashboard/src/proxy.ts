import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_AUTHENTICATED_PATH = "/menu";
const PROTECTED_PATH_PREFIXES = ["/"];
const AUTH_COOKIE_PREFIX =
  process.env.BETTER_AUTH_COOKIE_PREFIX ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_COOKIE_PREFIX;

function isProtectedPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectToLogin(request: NextRequest, targetPath: string) {
  const loginUrl = new URL("/accedi", request.url);
  loginUrl.searchParams.set("redirect_to", targetPath);

  if (
    request.nextUrl.pathname === loginUrl.pathname &&
    request.nextUrl.search === loginUrl.search
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(loginUrl);
}

function redirectToPath(request: NextRequest, targetPath: string) {
  const targetUrl = new URL(targetPath, request.url);

  if (
    request.nextUrl.pathname === targetUrl.pathname &&
    request.nextUrl.search === targetUrl.search
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(targetUrl);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(
    getSessionCookie(
      request,
      AUTH_COOKIE_PREFIX ? { cookiePrefix: AUTH_COOKIE_PREFIX } : undefined
    )
  );

  if (pathname === "/") {
    if (isAuthenticated) {
      return redirectToPath(request, DEFAULT_AUTHENTICATED_PATH);
    }

    return redirectToLogin(request, pathname + search);
  }

  if (!isAuthenticated) {
    return redirectToLogin(request, pathname + search);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/"],
};
