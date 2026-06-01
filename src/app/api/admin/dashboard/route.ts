import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/services/admin/dashboard.admin.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/dashboard — sales + inventory summary (FR-021). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await getDashboardSummary());
  });
}
