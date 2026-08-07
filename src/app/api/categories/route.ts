import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { type: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("PUBLIC_CATEGORIES_ERROR", error);

    return NextResponse.json(
      {
        error: "Kategoriler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
