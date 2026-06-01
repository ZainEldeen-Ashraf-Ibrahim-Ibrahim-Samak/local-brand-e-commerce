"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Select, Card, CardBody, Badge } from "@/components/ui";

export type ManagedCoupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usedCount: number;
  usageLimit: number;
  isActive: boolean;
};

export type ManagedDiscount = {
  id: string;
  nameEn: string;
  type: "percentage" | "fixed";
  value: number;
  scope: string;
  isActive: boolean;
};

/** Admin coupons + discounts manager (FR-023/FR-025). Values entered as %/major units. */
export function PromotionsManager({
  coupons,
  discounts,
}: {
  coupons: ManagedCoupon[];
  discounts: ManagedDiscount[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Coupon form
  const [code, setCode] = useState("");
  const [cType, setCType] = useState<"percentage" | "fixed">("percentage");
  const [cValue, setCValue] = useState("");
  const [cLimit, setCLimit] = useState("0");

  // Discount form
  const [dName, setDName] = useState("");
  const [dType, setDType] = useState<"percentage" | "fixed">("percentage");
  const [dValue, setDValue] = useState("");
  const [dScope, setDScope] = useState<"all" | "category" | "product">("all");

  function encodeValue(type: "percentage" | "fixed", raw: string): number {
    const n = Number(raw);
    return type === "percentage" ? Math.round(n * 100) : Math.round(n * 100); // %→bps, major→minor
  }
  function decodeValue(type: "percentage" | "fixed", value: number): string {
    return type === "percentage" ? `${value / 100}%` : `${(value / 100).toFixed(2)}`;
  }

  async function createCoupon(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type: cType,
        value: encodeValue(cType, cValue),
        usageLimit: Number(cLimit) || 0,
      }),
    });
    if (!res.ok) return setError("Could not create coupon (code may exist)");
    setCode("");
    setCValue("");
    setCLimit("0");
    router.refresh();
  }

  async function createDiscount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: { en: dName, ar: dName },
        type: dType,
        value: encodeValue(dType, dValue),
        scope: dScope,
      }),
    });
    if (!res.ok) return setError("Could not create discount");
    setDName("");
    setDValue("");
    router.refresh();
  }

  async function removeCoupon(id: string) {
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function removeDiscount(id: string) {
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-danger">{error}</p>}

      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-fg">Coupons</h2>
          {coupons.length === 0 ? (
            <p className="text-sm text-muted-fg">No coupons yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {coupons.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="font-mono font-medium text-fg">{c.code}</span>
                  <span className="text-muted-fg">{decodeValue(c.type, c.value)}</span>
                  <span className="text-muted-fg">
                    used {c.usedCount}
                    {c.usageLimit > 0 ? `/${c.usageLimit}` : ""}
                  </span>
                  {!c.isActive && <Badge tone="danger">inactive</Badge>}
                  <Button variant="outline" size="sm" className="ms-auto" onClick={() => removeCoupon(c.id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={createCoupon} className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} required />
            <Select value={cType} onChange={(e) => setCType(e.target.value as "percentage" | "fixed")}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </Select>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={cType === "percentage" ? "%" : "amount"}
              value={cValue}
              onChange={(e) => setCValue(e.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              placeholder="Usage limit (0=∞)"
              value={cLimit}
              onChange={(e) => setCLimit(e.target.value)}
            />
            <Button type="submit" size="sm">
              Add coupon
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-fg">Discounts</h2>
          {discounts.length === 0 ? (
            <p className="text-sm text-muted-fg">No discounts yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {discounts.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="font-medium text-fg">{d.nameEn || "(unnamed)"}</span>
                  <span className="text-muted-fg">{decodeValue(d.type, d.value)}</span>
                  <Badge tone="neutral">{d.scope}</Badge>
                  {!d.isActive && <Badge tone="danger">inactive</Badge>}
                  <Button variant="outline" size="sm" className="ms-auto" onClick={() => removeDiscount(d.id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={createDiscount} className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Input placeholder="Name" value={dName} onChange={(e) => setDName(e.target.value)} required />
            <Select value={dType} onChange={(e) => setDType(e.target.value as "percentage" | "fixed")}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </Select>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={dType === "percentage" ? "%" : "amount"}
              value={dValue}
              onChange={(e) => setDValue(e.target.value)}
              required
            />
            <Select value={dScope} onChange={(e) => setDScope(e.target.value as "all" | "category" | "product")}>
              <option value="all">All products</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </Select>
            <Button type="submit" size="sm">
              Add discount
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
