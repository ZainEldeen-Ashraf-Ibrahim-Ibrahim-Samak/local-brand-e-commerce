"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardBody, Input, Badge, Spinner } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney } from "@/lib/format";
import type { AppLocale } from "@/lib/config/env";

type Tracking = {
  orderNumber: string;
  status: string;
  statusHistory: { to: string; at: string }[];
  items: { name: { en: string; ar: string }; options: Record<string, string>; quantity: number; lineTotal: number }[];
  totals: { grandTotal: number };
};

/** Guest order tracking page (FR-013). */
export default function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const lc = locale as AppLocale;
  const t = useTranslations("track");
  const ts = useTranslations("order.status");
  const [form, setForm] = useState({ orderNumber: "", email: "", whatsapp: "" });
  const [result, setResult] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/storefront/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError(t("notFound"));
        return;
      }
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = (s: string) => {
    try {
      return ts(s as never);
    } catch {
      return s;
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-fg">{t("title")}</h1>

      <Card>
        <CardBody>
          <form onSubmit={lookup} className="space-y-3">
            <Input
              placeholder={t("orderNumber")}
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : t("lookup")}
            </Button>
          </form>
        </CardBody>
      </Card>

      {error && <p className="text-center text-sm text-danger">{error}</p>}

      {result && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-fg">{result.orderNumber}</span>
              <Badge tone="success">{statusLabel(result.status)}</Badge>
            </div>
            <ul className="space-y-1 text-sm text-muted-fg">
              {result.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {pickLocale(i.name, lc)} ×{i.quantity}
                  </span>
                  <span>{formatMoney(i.lineTotal, lc)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-fg">
              <span>{result.statusHistory.length} steps</span>
              <span>{formatMoney(result.totals.grandTotal, lc)}</span>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
