import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

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
        error:
          language === "de"
            ? "Fehler beim Laden der Kategorien."
            : "Kategoriler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
