"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart/useCart";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Spinner, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";
import { useParams } from "next/navigation";

// Type needed for Quote definition below
type Quote = {
  totals: { subtotal: number; discountTotal: number; taxTotal: number; shippingCost: number; grandTotal: number };
  shippingOption?: { id: string; label: { en: string; ar: string }; cost: number };
  coupon?:
    | { applied: true; code: string; reduction: number }
    | { applied: false; code: string; reason: string }
    | null;
};

type ShippingOption = { id: string; label: { en: string; ar: string }; cost: number; estimatedDays?: number };

/** Checkout: collect customer + shipping, apply coupon, show server-validated totals. */
export default function CheckoutPage() {
  const params = useParams();
  const locale = (params.locale as AppLocale) ?? "en";
  const { items, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", line1: "", city: "", country: "" });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [error, setError] = useState<string | null>(null);

  const itemsKey = JSON.stringify(items.map((i) => ({ v: i.variationId, q: i.quantity })));

  // Load available shipping options once; default to the first.
  useEffect(() => {
    fetch("/api/storefront/checkout/options")
      .then((r) => (r.ok ? r.json() : { shippingOptions: [] }))
      .then((d) => {
        const opts: ShippingOption[] = d.shippingOptions ?? [];
        setShippingOptions(opts);
        setShippingOptionId((cur) => cur || opts[0]?.id || "");
      })
      .catch(() => {});
  }, []);

  const fetchQuote = useCallback(
    async (couponCode?: string) => {
      if (items.length === 0) {
        setQuote(null);
        return;
      }
      setLoading(true);
      const endpoint = couponCode ? "/api/storefront/coupons/apply" : "/api/storefront/checkout/quote";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
          ...(shippingOptionId ? { shippingOptionId } : {}),
          ...(couponCode ? { code: couponCode } : {}),
        }),
      });
      if (res.ok) setQuote(await res.json());
      setLoading(false);
    },
    [items, itemsKey, shippingOptionId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    fetchQuote(appliedCoupon || undefined);
  }, [fetchQuote, appliedCoupon]);

  const applyCoupon = async () => {
    setAppliedCoupon(coupon.trim());
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/storefront/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
        shippingOptionId: shippingOptionId || quote?.shippingOption?.id || "",
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        customer: { name: form.name, email: form.email, whatsapp: form.whatsapp },
        shippingAddress: { line1: form.line1, city: form.city, country: form.country },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      clear();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else router.push(`/checkout/success?order=${data.orderNumber}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Could not place the order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-fg">Checkout</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              placeholder="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              required
            />
            <Input
              placeholder="Address line"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              required
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />

            {shippingOptions.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-fg">Shipping method</legend>
                {shippingOptions.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-token border border-border p-2 text-sm hover:border-primary"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipping"
                        value={o.id}
                        checked={shippingOptionId === o.id}
                        onChange={() => setShippingOptionId(o.id)}
                      />
                      <span className="text-fg">
                        {pickLocale(o.label, locale)}
                        {o.estimatedDays ? ` · ${o.estimatedDays}d` : ""}
                      </span>
                    </span>
                    <span className="text-muted-fg">{formatMoney(o.cost, locale)}</span>
                  </label>
                ))}
              </fieldset>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-fg">Payment method</legend>
              <label className="flex cursor-pointer items-center gap-2 rounded-token border border-border p-2 text-sm hover:border-primary">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span className="text-fg">Cash on delivery</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-token border border-border p-2 text-sm hover:border-primary">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span className="text-fg">Pay with card (Visa / Mastercard)</span>
              </label>
            </fieldset>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || items.length === 0 || (shippingOptions.length > 0 && !shippingOptionId)}
            >
              {loading ? <Spinner /> : paymentMethod === "cod" ? "Place order (COD)" : "Pay & place order"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-fg">Summary</h2>

          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="uppercase"
            />
            <Button type="button" variant="outline" onClick={applyCoupon} disabled={!coupon.trim()}>
              Apply
            </Button>
          </div>
          {quote?.coupon?.applied && (
            <p className="mb-3">
              <Badge tone="success">Coupon {quote.coupon.code} applied</Badge>
            </p>
          )}
          {quote?.coupon && !quote.coupon.applied && (
            <p className="mb-3">
              <Badge tone="danger">Coupon not valid</Badge>
            </p>
          )}

          {loading && <Spinner />}
          {quote && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-fg">Subtotal</dt>
                <dd className="text-fg">{formatMoney(quote.totals.subtotal, locale)}</dd>
              </div>
              {quote.totals.discountTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-fg">Discount</dt>
                  <dd className="text-fg">- {formatMoney(quote.totals.discountTotal, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-fg">Tax</dt>
                <dd className="text-fg">{formatMoney(quote.totals.taxTotal, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Shipping</dt>
                <dd className="text-fg">{formatMoney(quote.totals.shippingCost, locale)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt className="text-fg">Total</dt>
                <dd className="text-fg">{formatMoney(quote.totals.grandTotal, locale)}</dd>
              </div>
            </dl>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
