import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { getTaxShippingPolicy } from "@/services/settings.service";

/** GET /api/storefront/checkout/options — active shipping options for checkout (FR-028). */
export async function GET() {
  return handleRoute(async () => {
    const policy = await getTaxShippingPolicy();
    return NextResponse.json({
      shippingOptions: (policy.shippingOptions ?? [])
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, label: s.label, cost: s.cost, estimatedDays: s.estimatedDays })),
    });
  });
}
