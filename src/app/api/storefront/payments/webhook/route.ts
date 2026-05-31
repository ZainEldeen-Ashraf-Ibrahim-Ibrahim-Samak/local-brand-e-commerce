import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/stripe";
import { markOrderPaid, markOrderFailed } from "@/services/order.service";
import { logger } from "@/lib/observability/logger";

/**
 * POST /api/storefront/payments/webhook — gateway callback (signature-verified).
 * Success → confirm order + commit stock + notify. Failure → fail order + restore
 * stock + preserve cart (FR-011/FR-012/FR-014). Idempotent.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  try {
    const result = await getPaymentProvider().verifyWebhook(rawBody, signature);
    if (!result.orderId) return NextResponse.json({ received: true });
    if (result.outcome === "paid") await markOrderPaid(result.orderId, result.reference);
    else await markOrderFailed(result.orderId, result.reference);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Payment webhook rejected", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: { code: "WEBHOOK_INVALID", message: "Invalid webhook" } }, { status: 400 });
  }
}
