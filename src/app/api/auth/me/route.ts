import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Lütfen giriş yapın.",
      },
      {
        status: 401,
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },

    select: {
      id: true,
      email: true,
      role: true,
      customerType: true,
      firstName: true,
      lastName: true,
      companyName: true,
      phone: true,
      profileCompleted: true,

      dealerProfile: {
        select: {
          dealerNumber: true,
          companyName: true,
          contactName: true,
          phone: true,
          taxNumber: true,
          street: true,
          houseNumber: true,
          postalCode: true,
          city: true,
          country: true,
          creditLimit: true,
          currentBalance: true,
          active: true,
        },
      },

      addresses: {
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],

        select: {
          id: true,
          street: true,
          houseNumber: true,
          postalCode: true,
          city: true,
          country: true,
          floor: true,
          doorbellName: true,
          isDefault: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "Kullanıcı bulunamadı.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    user,
  });
}
