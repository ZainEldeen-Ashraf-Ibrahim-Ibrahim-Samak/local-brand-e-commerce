import Stripe from "stripe";
import { getEnv } from "@/lib/config/env";
import type { CreateSessionInput, PaymentProvider, PaymentSession, WebhookResult } from "./adapter";

/** Stripe implementation of the provider-agnostic PaymentProvider (research R1). */
class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  private client: Stripe;

  constructor(secretKey: string) {
    this.client = new Stripe(secretKey);
  }

  async createPaymentSession(input: CreateSessionInput): Promise<PaymentSession> {
    const session = await this.client.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: { name: `Order ${input.orderNumber}` },
          },
        },
      ],
    });
    return { provider: this.name, sessionId: session.id, redirectUrl: session.url ?? undefined };
  }

  async verifyWebhook(rawBody: string, signature: string | null): Promise<WebhookResult> {
    const { STRIPE_WEBHOOK_SECRET } = getEnv();
    if (!signature || !STRIPE_WEBHOOK_SECRET) throw new Error("Missing webhook signature/secret");
    const event = this.client.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      return { orderId: s.client_reference_id ?? s.metadata?.orderId ?? "", outcome: "paid", reference: s.id };
    }
    if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const s = event.data.object as Stripe.Checkout.Session;
      return { orderId: s.client_reference_id ?? s.metadata?.orderId ?? "", outcome: "failed", reference: s.id };
    }
    throw new Error(`Unhandled Stripe event: ${event.type}`);
  }

  async getPaymentStatus(sessionId: string): Promise<"paid" | "pending" | "failed"> {
    const s = await this.client.checkout.sessions.retrieve(sessionId);
    if (s.payment_status === "paid") return "paid";
    if (s.status === "expired") return "failed";
    return "pending";
  }
}

let provider: PaymentProvider | null = null;

/** Resolve the configured payment provider (currently Stripe). */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  provider = new StripeProvider(env.STRIPE_SECRET_KEY);
  return provider;
}
