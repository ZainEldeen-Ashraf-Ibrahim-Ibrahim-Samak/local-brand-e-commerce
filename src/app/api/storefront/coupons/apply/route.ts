import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { priceCart } from "@/services/order.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(1),
  items: z.array(z.object({ variationId: z.string(), quantity: z.number().int().positive() })),
  shippingOptionId: z.string().optional(),
});

/**
 * POST /api/storefront/coupons/apply — re-price the cart with a coupon applied
 * (FR-025). Returns the same quote shape as /checkout/quote plus coupon status so
 * the UI shows the (no-stacking) effective discount. Does not redeem the coupon.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = schema.parse(await req.json());
    const quote = await priceCart(body.items, body.shippingOptionId, body.code);
    return NextResponse.json(quote);
  });
}
