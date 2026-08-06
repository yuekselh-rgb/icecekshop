import { verifySessionToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function apiError(message: string, status: 401 | 403) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

function getHomePath(
  role: "CUSTOMER" | "DRIVER" | "DEALER" | "ADMIN" | "SUPER_ADMIN",
) {
  if (role === "DRIVER") {
    return "/sofor";
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "SUPER_ADMIN") {
    return "/super-admin";
  }

  return "/";
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("paketmarket_session")?.value;

  const session = token ? await verifySessionToken(token) : null;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  const isSuperAdminPage =
    pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  const isDriverPage = pathname === "/sofor" || pathname.startsWith("/sofor/");

  const isAdminApi =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  const isSuperAdminApi =
    pathname === "/api/super-admin" || pathname.startsWith("/api/super-admin/");

  const isDriverApi =
    pathname === "/api/sofor" || pathname.startsWith("/api/sofor/");

  /*
   * API isteklerinde yönlendirme yapılmaz.
   * JSON olarak 401 veya 403 döndürülür.
   */

  if (isAdminApi) {
    if (!session) {
      return apiError("Oturum açmanız gerekiyor.", 401);
    }

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return apiError("Admin alanına erişim yetkiniz yok.", 403);
    }

    return NextResponse.next();
  }

  if (isSuperAdminApi) {
    if (!session) {
      return apiError("Oturum açmanız gerekiyor.", 401);
    }

    if (session.role !== "SUPER_ADMIN") {
      return apiError("Super Admin alanına erişim yetkiniz yok.", 403);
    }

    return NextResponse.next();
  }

  if (isDriverApi) {
    if (!session) {
      return apiError("Oturum açmanız gerekiyor.", 401);
    }

    if (session.role !== "DRIVER") {
      return apiError("Şoför alanına erişim yetkiniz yok.", 403);
    }

    return NextResponse.next();
  }

  /*
   * Sayfa isteklerinde kullanıcı kendi paneline yönlendirilir.
   */

  if (isAdminPage) {
    if (!session) {
      return redirectTo(request, "/giris");
    }

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return redirectTo(request, getHomePath(session.role));
    }

    return NextResponse.next();
  }

  if (isSuperAdminPage) {
    if (!session) {
      return redirectTo(request, "/giris");
    }

    if (session.role !== "SUPER_ADMIN") {
      return redirectTo(request, getHomePath(session.role));
    }

    return NextResponse.next();
  }

  if (isDriverPage) {
    if (!session) {
      return redirectTo(request, "/giris");
    }

    if (session.role !== "DRIVER") {
      return redirectTo(request, getHomePath(session.role));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/sofor/:path*",

    "/api/admin/:path*",
    "/api/super-admin/:path*",
    "/api/sofor/:path*",
  ],
};
