import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { listInquiries } from "@/services/support.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/support — List all support inquiries (admin-only) */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    
    const inquiries = await listInquiries({ status });
    return NextResponse.json(inquiries);
  });
}
