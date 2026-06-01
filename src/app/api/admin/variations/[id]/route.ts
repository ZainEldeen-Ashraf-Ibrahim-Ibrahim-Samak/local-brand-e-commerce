import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { mediaRefSchema } from "@/lib/shared/types";
import { updateVariation } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  sku: z.string().min(1).optional(),
  options: z.record(z.string(), z.string()).optional(),
  priceOverride: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image: mediaRefSchema.optional(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/admin/variations/:id — edit a variation (price/options/image). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = schema.parse(await req.json());
    const variation = await updateVariation(id, body);
    return NextResponse.json(variation);
  });
}
