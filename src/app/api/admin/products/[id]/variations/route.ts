import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { mediaRefSchema } from "@/lib/shared/types";
import { addVariation } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  sku: z.string().min(1),
  options: z.record(z.string(), z.string()).optional(),
  priceOverride: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image: mediaRefSchema.optional(),
  isActive: z.boolean().optional(),
});

/** POST /api/admin/products/:id/variations — add a variation to a product (FR-019). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = schema.parse(await req.json());
    const variation = await addVariation(id, body);
    return NextResponse.json(variation, { status: 201 });
  });
}
