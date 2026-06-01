import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateCoupon, deleteCoupon } from "@/services/admin/promotions.admin.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  code: z.string().min(1).optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.number().int().min(0).optional(),
  minSubtotal: z.number().int().min(0).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  usageLimit: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/admin/coupons/:id — edit a coupon. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    return NextResponse.json(await updateCoupon(id, body));
  });
}

/** DELETE /api/admin/coupons/:id — remove a coupon. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await deleteCoupon(id);
    return new NextResponse(null, { status: 204 });
  });
}
