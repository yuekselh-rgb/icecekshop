import { verifySessionToken, type AuthRole } from "@/lib/auth";
import { isPlatformHost } from "@/lib/tenant";
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

function getHomePath(role: AuthRole) {
  if (role === "DRIVER") {
    return "/sofor";
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "SUPER_ADMIN") {
    return "/super-admin";
  }

  if (role === "PLATFORM_OWNER") {
    return "/platform";
  }

  return "/";
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("paketmarket_session")?.value;

  const session = token ? await verifySessionToken(token) : null;

  const host = request.headers.get("host");
  const isPlatform = isPlatformHost(host);

  const isPlatformPage = pathname === "/platform" || pathname.startsWith("/platform/");
  const isPlatformApi = pathname === "/api/platform" || pathname.startsWith("/api/platform/");

  /*
   * Die Platform-Host-Domain ist ausschließlich für den Platform-Owner-
   * Bereich da. Auf Tenant-Domains ist /platform nicht erreichbar, und
   * umgekehrt lässt der Platform-Host sonst nichts anderes durch.
   *
   * Auf dem Platform-Host selbst werden "/" und "/giris" transparent auf
   * "/platform" bzw. "/platform/giris" umgeschrieben (rewrite, keine
   * sichtbare Weiterleitung), damit man ohne "/platform"-Präfix auskommt —
   * der Host dient ja ohnehin ausschließlich diesem Bereich.
   */

  if (isPlatform) {
    if (pathname === "/giris") {
      return NextResponse.rewrite(new URL("/platform/giris", request.url));
    }

    if (pathname === "/") {
      if (!session) {
        return NextResponse.rewrite(new URL("/platform/giris", request.url));
      }

      if (session.role !== "PLATFORM_OWNER") {
        return redirectTo(request, getHomePath(session.role));
      }

      return NextResponse.rewrite(new URL("/platform", request.url));
    }

    if (!isPlatformPage && !isPlatformApi) {
      return redirectTo(request, "/");
    }
  } else if (isPlatformPage || isPlatformApi) {
    return NextResponse.redirect(new URL("/", `https://${host}`));
  }

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

  if (isPlatformApi && pathname !== "/api/platform/auth/login") {
    if (!session) {
      return apiError("Oturum açmanız gerekiyor.", 401);
    }

    if (session.role !== "PLATFORM_OWNER") {
      return apiError("Bu alana erişim yetkiniz yok.", 403);
    }

    return NextResponse.next();
  }

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

  if (isPlatformPage && pathname !== "/platform/giris") {
    if (!session) {
      return redirectTo(request, "/giris");
    }

    if (session.role !== "PLATFORM_OWNER") {
      return redirectTo(request, getHomePath(session.role));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/giris",

    "/admin/:path*",
    "/super-admin/:path*",
    "/sofor/:path*",
    "/platform/:path*",

    "/api/admin/:path*",
    "/api/super-admin/:path*",
    "/api/sofor/:path*",
    "/api/platform/:path*",
  ],
};
