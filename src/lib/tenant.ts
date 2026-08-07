import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { cache } from "react";
import { prisma, tenantContext } from "@/lib/prisma";

export type CurrentTenant = {
  id: string;
  name: string;
  active: boolean;
};

function hostnameFrom(hostHeader: string | null) {
  return hostHeader?.split(":")[0] ?? null;
}

/**
 * Resolves the tenant for the current request from the `Host` header.
 * Cached per request (React `cache`) so repeated calls across Server
 * Components/route handlers within the same request don't re-hit the DB.
 */
export const getCurrentTenant = cache(async (): Promise<CurrentTenant | null> => {
  const hostname = hostnameFrom((await headers()).get("host"));

  if (!hostname) {
    return null;
  }

  const domain = await prisma.tenantDomain.findUnique({
    where: { domain: hostname },
    select: {
      tenant: { select: { id: true, name: true, active: true } },
    },
  });

  if (!domain || !domain.tenant.active) {
    return null;
  }

  return domain.tenant;
});

export function isPlatformHost(hostHeader: string | null) {
  const platformHost = process.env.PLATFORM_HOST;

  if (!platformHost) {
    return false;
  }

  return hostnameFrom(hostHeader) === platformHost;
}

type TenantRouteHandler<Context> = (
  request: NextRequest,
  context: Context,
  tenant: CurrentTenant,
) => Promise<Response> | Response;

/**
 * Wraps a Route Handler so every Prisma call made while it runs is
 * automatically scoped to the tenant resolved from the request's Host
 * header (see the Prisma Client extension in `src/lib/prisma.ts`).
 * Returns 404 for hosts that don't map to an active tenant.
 *
 * The resolved tenant is passed as a third argument so `.create()`/
 * `.upsert()` calls (which TypeScript still requires `tenantId` for, since
 * the extension only injects it at runtime) can set it explicitly.
 */
export function withTenant<Context = unknown>(
  handler: TenantRouteHandler<Context>,
): (request: NextRequest, context: Context) => Promise<Response> {
  return async (request, context) => {
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json({ error: "Shop nicht gefunden." }, { status: 404 });
    }

    return tenantContext.run({ tenantId: tenant.id }, () =>
      handler(request, context, tenant),
    );
  };
}
