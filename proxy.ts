import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware -> Proxy. Same behavior.
// Gates the /dashboard area and its data API behind a shared-password cookie.

const COOKIE = "apb_dash";
const PASSWORD = process.env.DASHBOARD_PASSWORD || "Repriced1!";

async function expectedToken(): Promise<string> {
  const data = new TextEncoder().encode("apb|" + PASSWORD);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login screen and the auth endpoints.
  if (
    pathname.startsWith("/dashboard/login") ||
    pathname.startsWith("/api/dashboard/login") ||
    pathname.startsWith("/api/dashboard/logout")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const authed = token != null && token === (await expectedToken());

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/api/dashboard/:path*"],
};
