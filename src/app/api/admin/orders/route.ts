import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { listAdminOrders } from "@/services/admin/orders.admin.service";
import type { OrderStatus } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Logical completion stage → concrete statuses mapping (T022, FR-020). */
const COMPLETION_GROUPS: Record<string, OrderStatus[]> = {
  pending: ["pending"],
  completed: ["confirmed", "processing", "shipped", "delivered"],
  failed: ["cancelled", "failed", "returned", "refunded"],
};

/** GET /api/admin/orders — list/filter orders (FR-020). */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const sp = req.nextUrl.searchParams;

    // ?completion=pending|completed|failed takes precedence over ?status= when present.
    const completion = sp.get("completion");
    const statuses = completion ? COMPLETION_GROUPS[completion] : undefined;

    const result = await listAdminOrders({
      status: statuses?.length === 1 ? statuses[0] : (sp.get("status") as OrderStatus) ?? undefined,
      statuses: statuses && statuses.length > 1 ? statuses : undefined,
      q: sp.get("q") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}
