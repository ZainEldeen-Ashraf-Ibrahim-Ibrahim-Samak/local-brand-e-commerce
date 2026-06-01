import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, Errors } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { adjustStock } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    delta: z.number().int().optional(),
    set: z.number().int().min(0).optional(),
    reason: z.string().optional(),
  })
  .refine((d) => d.delta != null || d.set != null, { message: "Provide delta or set" });

/** PATCH /api/admin/variations/:id/stock — adjust stock (logged) (FR-019). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireRole("admin");
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) throw Errors.validation(parsed.error.issues);
    const variation = await adjustStock(id, parsed.data, user.id);
    return NextResponse.json(variation);
  });
}
