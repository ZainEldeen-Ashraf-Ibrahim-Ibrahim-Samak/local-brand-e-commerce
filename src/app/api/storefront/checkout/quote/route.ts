import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { priceCart } from "@/services/order.service";

const schema = z.object({
  items: z.array(z.object({ variationId: z.string(), quantity: z.number().int().min(1) })).min(1),
  shippingOptionId: z.string().optional(),
  couponCode: z.string().optional(),
});

/** POST /api/storefront/checkout/quote — itemized totals before payment (FR-009). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = schema.parse(await req.json());
    const priced = await priceCart(body.items, body.shippingOptionId);
    return NextResponse.json({
      subtotal: priced.totals.subtotal,
      discountTotal: priced.totals.discountTotal,
      taxTotal: priced.totals.taxTotal,
      shippingCost: priced.totals.shippingCost,
      grandTotal: priced.totals.grandTotal,
      shippingOption: priced.shippingOption,
      unavailable: priced.unavailable,
    });
  });
}
