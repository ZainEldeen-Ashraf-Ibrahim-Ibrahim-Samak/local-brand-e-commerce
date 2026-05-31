import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { listCategoryTree } from "@/services/catalog.service";

/** GET /api/storefront/categories — active category tree. */
export async function GET() {
  return handleRoute(async () => {
    return NextResponse.json({ tree: await listCategoryTree() });
  });
}
