import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { getEnv } from "@/lib/config/env";
import { expireStaleOrders } from "@/services/order.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/expire-orders
 *
 * Sweeps pending orders whose `expiresAt` has passed, transitions them to
 * `failed`, and restores reserved stock (FR-013). Protected by a bearer token
 * so only an authorised scheduler may invoke it (Constitution Principle III).
 *
 * Add to vercel.json crons or trigger from GitHub Actions / Railway.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { CRON_SECRET } = getEnv();

    // Allow unauthenticated calls only when no secret is configured (local dev).
    if (CRON_SECRET) {
      const auth = req.headers.get("authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { expired } = await expireStaleOrders();
    return NextResponse.json({ ok: true, expired });
  });
}
