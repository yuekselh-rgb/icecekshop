import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requirePlatformOwner() {
  const session = await getSession();

  if (!session || session.role !== "PLATFORM_OWNER") {
    return null;
  }

  return session;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { id: tenantId } = await params;
    const body = await request.json();

    const domain = String(body.domain || "").trim().toLowerCase();

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

    const created = await prisma.tenantDomain.create({
      data: {
        tenantId,
        domain,
        isPrimary: false,
      },
    });

    return NextResponse.json(
      { message: "Domain hinzugefügt.", domain: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADD_TENANT_DOMAIN_ERROR", error);

    return NextResponse.json(
      { error: "Domain konnte nicht hinzugefügt werden." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId ist erforderlich." },
        { status: 400 },
      );
    }

    const domain = await prisma.tenantDomain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      return NextResponse.json(
        { error: "Domain nicht gefunden." },
        { status: 404 },
      );
    }

    if (domain.isPrimary) {
      return NextResponse.json(
        { error: "Die primäre Domain kann nicht entfernt werden." },
        { status: 400 },
      );
    }

    await prisma.tenantDomain.delete({
      where: { id: domainId },
    });

    return NextResponse.json({ message: "Domain entfernt." });
  } catch (error) {
    console.error("DELETE_TENANT_DOMAIN_ERROR", error);

    return NextResponse.json(
      { error: "Domain konnte nicht entfernt werden." },
      { status: 500 },
    );
  }
}
