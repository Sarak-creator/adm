import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken, isIpAllowed, getClientIp } from "@/lib/admin-auth-edge";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const secretPath = (process.env.ADMIN_SECRET_PATH || "portal-anachak-9821").replace(/^\/+|\/+$/g, "");
  const clientIp = getClientIp(req);

  // ========================================================
  // 1. CLOAKING: Disguise standard /admin & /dashboard routes
  // Scanners and bots probing these common URLs get a fake 404
  // ========================================================
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  ) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // ========================================================
  // 2. Allow Admin Auth API Route (/api/admin/auth)
  // ========================================================
  if (pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  // ========================================================
  // 3. Protect internal Admin APIs (/api/admin/...)
  // ========================================================
  if (pathname.startsWith("/api/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Access Denied",
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ========================================================
  // 4. Handle Obscure Secret Admin Path (/${secretPath})
  // ========================================================
  const isSecretAdminRoute = pathname === `/${secretPath}` || pathname.startsWith(`/${secretPath}/`);

  if (isSecretAdminRoute) {
    // A. Check IP Whitelist
    if (!isIpAllowed(clientIp)) {
      // Cloak with fake 404 if IP is not whitelisted
      return NextResponse.rewrite(new URL("/404", req.url));
    }

    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(token);
    const isAuthenticated = Boolean(payload && payload.role === "ADMIN");

    // Case 1: Secret Login Route (/${secretPath}/login)
    if (pathname === `/${secretPath}/login`) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL(`/${secretPath}`, req.url));
      }
      // Internally rewrite to the login UI page component
      const rewriteUrl = new URL("/admin/login", req.url);
      rewriteUrl.search = search;
      return NextResponse.rewrite(rewriteUrl);
    }

    // Case 2: Accessing Secret Dashboard without authentication
    // STEALTH CLOAKING: Rewrite to 404 so unauthenticated users think this URL does not exist!
    if (!isAuthenticated) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }

    // Case 3: Authenticated Admin accessing the secret dashboard
    // Internally rewrite to /admin while keeping /portal-anachak-9821 in the browser address bar
    const subpath = pathname.substring(`/${secretPath}`.length);
    const destinationPath = subpath ? `/admin${subpath}` : "/admin";
    const rewriteUrl = new URL(destinationPath, req.url);
    rewriteUrl.search = search;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
