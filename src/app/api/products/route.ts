import { getPublicProducts } from "@/lib/public-products";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
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
});
