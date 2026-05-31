import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { transitionOrder } from "@/services/order.service";
import { ORDER_STATUSES } from "@/lib/shared/types";

const schema = z.object({
  to: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

/**
 * PATCH /api/admin/orders/:id/status — transition status (validated against the
 * FR-036 lifecycle). Invalid transitions return 422; a successful change triggers
 * the customer notification (FR-014).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireRole("admin");
    const { id } = await params;
    const body = schema.parse(await req.json());
    const order = await transitionOrder(id, body.to, user.id, body.note);
    return NextResponse.json(order);
  });
}
