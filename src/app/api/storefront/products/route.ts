import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { listProducts, type CatalogQuery } from "@/services/catalog.service";

/** GET /api/storefront/products — filter/search/facet catalog (FR-001/FR-002/FR-003). */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const sp = req.nextUrl.searchParams;
    const num = (k: string) => (sp.get(k) != null ? Number(sp.get(k)) : undefined);
    const query: CatalogQuery = {
      categorySlug: sp.get("category") ?? undefined,
      q: sp.get("q") ?? undefined,
      size: sp.get("size") ?? undefined,
      color: sp.get("color") ?? undefined,
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      sort: (sp.get("sort") as CatalogQuery["sort"]) ?? undefined,
      page: num("page"),
      pageSize: num("pageSize"),
    };
    return NextResponse.json(await listProducts(query));
  });
}
