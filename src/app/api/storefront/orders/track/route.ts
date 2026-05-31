import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { trackOrder } from "@/services/tracking.service";

const schema = z.object({
  orderNumber: z.string().min(1),
  email: z.string().email(),
  whatsapp: z.string().min(1),
});

/** POST /api/storefront/orders/track — guest order lookup (FR-013, non-enumerable). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = schema.parse(await req.json());
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await trackOrder({ ...body, ip });
    return NextResponse.json(result);
  });
}
