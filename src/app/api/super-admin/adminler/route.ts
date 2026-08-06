import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    admins,
  });
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const firstName = String(body.firstName || "").trim();

    const lastName = String(body.lastName || "").trim();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          error: "Tüm alanlar zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Şifre en az 8 karakter olmalıdır.",
        },
        {
          status: 400,
        },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Bu e-posta adresi zaten kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: "ADMIN",
        profileCompleted: true,
        emailVerified: true,

        adminPermission: {
          create: {
            viewProducts: true,
            viewCategories: true,
            viewStock: true,
            viewOrders: true,

            createProduct: false,
            updateProduct: false,
            deleteProduct: false,
            changePrice: false,

            createCategory: false,
            updateCategory: false,
            deleteCategory: false,

            addStock: false,
            reduceStock: false,

            updateOrder: false,
            approveCustomerPayment: false,
            deleteOrder: false,
            printOrder: false,

            viewCustomers: false,
            managePfand: false,
          },
        },
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Admin hesabı başarıyla oluşturuldu.",
        admin,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_ADMIN_ERROR", error);

    return NextResponse.json(
      {
        error: "Admin oluşturulurken bir hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
