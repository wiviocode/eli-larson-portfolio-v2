import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret() {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("AUTH_SECRET environment variable is required");
  return new TextEncoder().encode(key);
}

async function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const authed = await isAuthenticated(req);
    if (!authed) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect non-GET API media routes
  if (pathname.startsWith("/api/media") && req.method !== "GET") {
    const authed = await isAuthenticated(req);
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/media/:path*"],
};
