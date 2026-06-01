"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart/useCart";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Spinner, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
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

  const itemsKey = JSON.stringify(items.map((i) => ({ v: i.variationId, q: i.quantity })));

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
          ...(couponCode ? { code: couponCode } : {}),
        }),
      });
      if (res.ok) setQuote(await res.json());
      setLoading(false);
    },
    [items, itemsKey], // eslint-disable-line react-hooks/exhaustive-deps
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
    const res = await fetch("/api/storefront/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
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
            <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
              {loading ? <Spinner /> : "Place order"}
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
