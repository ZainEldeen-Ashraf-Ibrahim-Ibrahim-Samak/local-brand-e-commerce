import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { priceCart } from "@/services/order.service";

const schema = z.object({
  items: z.array(z.object({ variationId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

/** POST /api/storefront/cart/validate — reprice cart + flag unavailable items (FR-006/FR-005). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = schema.parse(await req.json());
    const priced = await priceCart(body.items);
    return NextResponse.json({
      items: priced.lines.map((l, i) => ({
        variationId: l.variationId,
        productName: l.productName,
        options: l.options,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        available: l.available,
        lineTotal: priced.totals.lines[i]?.lineTotal ?? 0,
      })),
      subtotal: priced.totals.subtotal,
      unavailable: priced.unavailable.map((variationId) => ({ variationId, reason: "out_of_stock" })),
    });
  });
}
