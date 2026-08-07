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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "Ungültige Anfrage." },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { active: body.active },
    });

    return NextResponse.json({ message: "Tenant aktualisiert.", tenant });
  } catch (error) {
    console.error("UPDATE_TENANT_ERROR", error);

    return NextResponse.json(
      { error: "Tenant konnte nicht aktualisiert werden." },
      { status: 500 },
    );
  }
}
