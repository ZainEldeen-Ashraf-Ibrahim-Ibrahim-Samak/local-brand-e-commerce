import { NextResponse } from "next/server";
import { handleRoute, Errors } from "@/lib/http/errors";
import { getProductBySlug } from "@/services/catalog.service";

/** GET /api/storefront/products/:slug — product detail with variations. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handleRoute(async () => {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) throw Errors.notFound("Product");
    return NextResponse.json(product);
  });
}
