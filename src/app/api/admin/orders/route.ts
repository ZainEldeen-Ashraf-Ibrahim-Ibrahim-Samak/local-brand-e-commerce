import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { listAdminOrders } from "@/services/admin/orders.admin.service";
import type { OrderStatus } from "@/lib/shared/types";

/** GET /api/admin/orders — list/filter orders (FR-020). */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const sp = req.nextUrl.searchParams;
    const result = await listAdminOrders({
      status: (sp.get("status") as OrderStatus) ?? undefined,
      q: sp.get("q") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}
