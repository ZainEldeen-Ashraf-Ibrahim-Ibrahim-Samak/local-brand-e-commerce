import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema } from "@/lib/shared/types";
import { listDiscounts, createDiscount } from "@/services/admin/promotions.admin.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: localizedTextSchema,
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(0),
  scope: z.enum(["all", "category", "product"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/** GET /api/admin/discounts — list discounts. */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await listDiscounts());
  });
}

/** POST /api/admin/discounts — create a discount (FR-023). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    return NextResponse.json(await createDiscount(body), { status: 201 });
  });
}
