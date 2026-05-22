import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Attach current pathname as header for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  // Protected route prefixes
  const protectedPrefixes = ["/admin", "/super-admin", "/retail"];

  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (isProtected) {
    const sessionToken = request.cookies.get("better-auth.session")?.value;

    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `callbackUrl=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
