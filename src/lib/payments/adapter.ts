/**
 * Provider-agnostic payment adapter (research R1). Order logic depends only on
 * this interface, so a regional gateway can replace Stripe without touching the
 * checkout/order code. The app never stores card data (Constitution Principle III).
 */
export type CreateSessionInput = {
  orderId: string;
  orderNumber: string;
  amount: number; // minor units
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type PaymentSession = {
  provider: string;
  sessionId: string;
  /** URL to redirect the customer to (hosted checkout) or client secret. */
  redirectUrl?: string;
  clientSecret?: string;
};

export type WebhookResult = {
  orderId: string;
  outcome: "paid" | "failed";
  reference: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPaymentSession(input: CreateSessionInput): Promise<PaymentSession>;
  /** Verify a webhook signature and extract the order outcome. Throws if invalid. */
  verifyWebhook(rawBody: string, signature: string | null): Promise<WebhookResult>;
  getPaymentStatus(sessionId: string): Promise<"paid" | "pending" | "failed">;
}
