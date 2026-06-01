import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema } from "@/lib/shared/types";
import { getTaxShippingPolicy } from "@/services/settings.service";
import { updateTaxShippingPolicy } from "@/services/admin/taxshipping.admin.service";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    tax: z.object({
      rateBasisPoints: z.number().int().min(0),
      inclusive: z.boolean(),
      label: localizedTextSchema,
    }),
    shippingOptions: z.array(
      z.object({
        id: z.string().min(1),
        label: localizedTextSchema,
        cost: z.number().int().min(0),
        estimatedDays: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      }),
    ),
  })
  .partial();

/** GET /api/admin/tax-shipping — current tax + shipping policy (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await getTaxShippingPolicy());
  });
}

/** PUT /api/admin/tax-shipping — update tax rule + shipping options (FR-028). */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    return NextResponse.json(await updateTaxShippingPolicy(body));
  });
}
