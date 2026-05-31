import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { getAdminOrder } from "@/services/admin/orders.admin.service";

/** GET /api/admin/orders/:id — order detail + status history (FR-020). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    return NextResponse.json(await getAdminOrder(id));
  });
}
