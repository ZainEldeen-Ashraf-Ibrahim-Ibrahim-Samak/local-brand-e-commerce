import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { getHome } from "@/services/home.service";

export const dynamic = "force-dynamic";

/** GET /api/storefront/home — homepage slider + featured products (FR-024). */
export async function GET() {
  return handleRoute(async () => {
    return NextResponse.json(await getHome());
  });
}
