import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isAdminSessionTokenValid,
} from "@/lib/adminSession";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isPublicAdminRoute =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if ((!isAdminPage && !isAdminApi) || isPublicAdminRoute) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = await isAdminSessionTokenValid(authCookie);

  if (isValid) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json(
      { ok: false, message: "Phiên quản trị đã hết hạn." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
