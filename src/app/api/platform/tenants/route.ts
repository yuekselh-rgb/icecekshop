import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

async function requirePlatformOwner() {
  const session = await getSession();

  if (!session || session.role !== "PLATFORM_OWNER") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        domains: {
          orderBy: { isPrimary: "desc" },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("LOAD_TENANTS_ERROR", error);

    return NextResponse.json(
      { error: "Tenants konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const domain = String(body.domain || "").trim().toLowerCase();
    const adminEmail = String(body.adminEmail || "").trim().toLowerCase();
    const adminPassword = String(body.adminPassword || "");
    const adminFirstName = String(body.adminFirstName || "").trim();
    const adminLastName = String(body.adminLastName || "").trim();

    if (!name || !domain || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Name, Domain, Admin-E-Mail und Passwort sind erforderlich." },
        { status: 400 },
      );
    }

    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return NextResponse.json(
        { error: "Ungültige Domain." },
        { status: 400 },
      );
    }

    const existingDomain = await prisma.tenantDomain.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: "Diese Domain ist bereits vergeben." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: { name },
      });

      await tx.tenantDomain.create({
        data: {
          tenantId: newTenant.id,
          domain,
          isPrimary: true,
        },
      });

      await tx.companySetting.create({
        data: {
          tenantId: newTenant.id,
          companyName: name,
        },
      });

      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          firstName: adminFirstName || null,
          lastName: adminLastName || null,
          profileCompleted: true,
          emailVerified: true,
        },
      });

      return newTenant;
    });

    return NextResponse.json(
      { message: "Tenant wurde angelegt.", tenant },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_TENANT_ERROR", error);

    return NextResponse.json(
      { error: "Tenant konnte nicht angelegt werden." },
      { status: 500 },
    );
  }
}
