import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema } from "@/lib/shared/types";
import { updateDiscount, deleteDiscount } from "@/services/admin/promotions.admin.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: localizedTextSchema.optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.number().int().min(0).optional(),
  scope: z.enum(["all", "category", "product"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/admin/discounts/:id — edit a discount. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    return NextResponse.json(await updateDiscount(id, body));
  });
}

/** DELETE /api/admin/discounts/:id — remove a discount. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await deleteDiscount(id);
    return new NextResponse(null, { status: 204 });
  });
}
