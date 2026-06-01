import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { listCoupons, createCoupon } from "@/services/admin/promotions.admin.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(1),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(0),
  minSubtotal: z.number().int().min(0).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  usageLimit: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/** GET /api/admin/coupons — list coupons. */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await listCoupons());
  });
}

/** POST /api/admin/coupons — create a coupon (FR-025). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    return NextResponse.json(await createCoupon(body), { status: 201 });
  });
}
