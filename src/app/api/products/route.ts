import { getPublicProducts } from "@/lib/public-products";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await getPublicProducts();

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("PUBLIC_PRODUCTS_ERROR", error);

    return NextResponse.json(
      {
        error: "Ürünler yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
