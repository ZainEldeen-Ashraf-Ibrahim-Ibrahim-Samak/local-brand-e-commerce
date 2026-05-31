"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardBody, Input, Select, Spinner } from "@/components/ui";
import { useCart } from "@/lib/cart/useCart";
import { formatMoney } from "@/lib/format";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

type ShippingOption = { id: string; label: { en: string; ar: string }; cost: number };
type Quote = { subtotal: number; taxTotal: number; shippingCost: number; grandTotal: number };

/** Guest checkout: contact + address + shipping, live quote, then pay (FR-007–FR-011). */
export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const lc = locale as AppLocale;
  const t = useTranslations("checkout");
  const { items } = useCart();

  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", whatsapp: "", name: "", line1: "", city: "", country: "" });

  useEffect(() => {
    fetch("/api/storefront/checkout/options")
      .then((r) => r.json())
      .then((d) => {
        setOptions(d.shippingOptions ?? []);
        setShippingOptionId(d.shippingOptions?.[0]?.id ?? "");
      });
  }, []);

  useEffect(() => {
    if (items.length === 0 || !shippingOptionId) return;
    fetch("/api/storefront/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
        shippingOptionId,
      }),
    })
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => setError("quote_failed"));
  }, [items, shippingOptionId]);

  async function pay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/storefront/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
          shippingOptionId,
          customer: { email: form.email, whatsapp: form.whatsapp, name: form.name },
          shippingAddress: { line1: form.line1, city: form.city, country: form.country },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.code ?? "checkout_failed");
        return;
      }
      if (data.payment?.sessionUrl) window.location.href = data.payment.sessionUrl;
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) return <p className="py-16 text-center text-muted-fg">{t("orderNumber")}</p>;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-fg">{t("contact")}</h2>
            <Input placeholder={t("name")} value={form.name} onChange={set("name")} />
            <Input placeholder={t("email")} type="email" value={form.email} onChange={set("email")} />
            <Input placeholder={t("whatsapp")} value={form.whatsapp} onChange={set("whatsapp")} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-fg">{t("address")}</h2>
            <Input placeholder="Address" value={form.line1} onChange={set("line1")} />
            <Input placeholder="City" value={form.city} onChange={set("city")} />
            <Input placeholder="Country" value={form.country} onChange={set("country")} />
            <Select value={shippingOptionId} onChange={(e) => setShippingOptionId(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {pickLocale(o.label, lc)} — {formatMoney(o.cost, lc)}
                </option>
              ))}
            </Select>
          </CardBody>
        </Card>
      </div>

      <Card className="h-fit">
        <CardBody className="space-y-2">
          {quote ? (
            <>
              <Row label={t("orderNumber")} value="" />
              <SummaryRow label="Subtotal" value={formatMoney(quote.subtotal, lc)} />
              <SummaryRow label="Tax" value={formatMoney(quote.taxTotal, lc)} />
              <SummaryRow label="Shipping" value={formatMoney(quote.shippingCost, lc)} />
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-fg">
                <span>Total</span>
                <span>{formatMoney(quote.grandTotal, lc)}</span>
              </div>
            </>
          ) : (
            <Spinner />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            size="lg"
            className="mt-2 w-full"
            disabled={submitting || !form.email || !form.whatsapp || !form.name || !form.line1}
            onClick={pay}
          >
            {submitting ? <Spinner /> : t("payNow")}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted-fg">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
function Row({ label }: { label: string; value: string }) {
  return <h2 className="font-semibold text-fg">{label}</h2>;
}
