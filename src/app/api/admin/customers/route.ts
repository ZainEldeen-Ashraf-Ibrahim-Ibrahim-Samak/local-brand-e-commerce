import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerList } from "@/services/admin/customers.admin.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/customers — List all aggregated customer records (admin-only) */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search") || undefined;
    
    const customers = await getCustomerList({ search });
    return NextResponse.json(customers);
  });
}
