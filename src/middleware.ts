import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap edge gate: anything under /app needs a session cookie. The session itself is
 * validated server-side (database lookup) by requireUser() in every page and action.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("ensign_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
