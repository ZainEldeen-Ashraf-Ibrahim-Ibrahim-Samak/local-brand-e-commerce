import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { getEnv } from "@/lib/config/env";
import { createPendingOrder } from "@/services/order.service";
import { getPaymentProvider } from "@/lib/payments/stripe";

const schema = z.object({
  items: z.array(z.object({ variationId: z.string(), quantity: z.number().int().min(1) })).min(1),
  shippingOptionId: z.string(),
  couponCode: z.string().optional(),
  customer: z.object({
    email: z.string().email(),
    whatsapp: z.string().min(5),
    name: z.string().min(1),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1),
    phone: z.string().optional(),
  }),
});

/**
 * POST /api/storefront/checkout — atomic stock reservation, create pending order,
 * initialize payment (FR-007–FR-011, FR-034). Guest only; no account required.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = schema.parse(await req.json());
    const order = await createPendingOrder(body); // throws OUT_OF_STOCK (409) on conflict

    const env = getEnv();
    const base = env.NEXT_PUBLIC_BASE_URL;
    const session = await getPaymentProvider().createPaymentSession({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: "usd",
      customerEmail: body.customer.email,
      successUrl: `${base}/checkout/success?order=${order.orderNumber}`,
      cancelUrl: `${base}/checkout?canceled=1`,
    });

    return NextResponse.json({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      payment: { provider: session.provider, sessionUrl: session.redirectUrl, clientSecret: session.clientSecret },
    });
  });
}
