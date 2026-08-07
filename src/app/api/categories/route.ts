import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
}
