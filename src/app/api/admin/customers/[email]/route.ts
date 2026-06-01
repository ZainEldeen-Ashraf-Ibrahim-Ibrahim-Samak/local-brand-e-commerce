import { NextRequest, NextResponse } from "next/server";
import { handleRoute, AppError } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerDetail } from "@/services/admin/customers.admin.service";

/** GET /api/admin/customers/[email] — Get customer contact details and order history (admin-only) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    try {
      const detail = await getCustomerDetail(decodedEmail);
      return NextResponse.json(detail);
    } catch (err) {
      if (err instanceof Error && err.message === "Customer not found") {
        throw new AppError("NOT_FOUND", err.message, 404);
      }
      throw err;
    }
  });
}
