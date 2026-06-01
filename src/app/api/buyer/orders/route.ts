import { NextResponse } from "next/server";
import { handleRoute, Errors } from "@/lib/http/errors";
import { requireUser } from "@/lib/auth/guards";
import { listOwnOrders } from "@/services/buyer.service";

export const dynamic = "force-dynamic";

/** GET /api/buyer/orders — orders containing the caller's products only (FR-029). */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    if (user.role !== "buyer") throw Errors.forbidden();
    return NextResponse.json(await listOwnOrders(user.id));
  });
}
