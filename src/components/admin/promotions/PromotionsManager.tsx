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
  categoryIds: string[];
  productIds: string[];
  isActive: boolean;
};

export type Option = { id: string; name: string };

/** Admin coupons + discounts manager (FR-023/FR-025). Values entered as %/major units. */
export function PromotionsManager({
  coupons,
  discounts,
  categories,
  products,
}: {
  coupons: ManagedCoupon[];
  discounts: ManagedDiscount[];
  categories: Option[];
  products: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Coupon form
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cType, setCType] = useState<"percentage" | "fixed">("percentage");
  const [cValue, setCValue] = useState("");
  const [cLimit, setCLimit] = useState("0");

  // Discount form
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [dName, setDName] = useState("");
  const [dType, setDType] = useState<"percentage" | "fixed">("percentage");
  const [dValue, setDValue] = useState("");
  const [dScope, setDScope] = useState<"all" | "category" | "product">("all");
  const [dCategoryIds, setDCategoryIds] = useState<string[]>([]);
  const [dProductIds, setDProductIds] = useState<string[]>([]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  function encodeValue(_type: "percentage" | "fixed", raw: string): number {
    return Math.round(Number(raw) * 100); // %→bps, major→minor
  }
  function decodeValue(type: "percentage" | "fixed", value: number): string {
    return type === "percentage" ? `${value / 100}%` : `${(value / 100).toFixed(2)}`;
  }

  // ---- Coupons ----
  async function submitCoupon(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : "/api/admin/coupons";
    const method = editingCouponId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type: cType,
        value: encodeValue(cType, cValue),
        usageLimit: Number(cLimit) || 0,
      }),
    });
    if (!res.ok) return setError(editingCouponId ? "Could not update coupon" : "Could not create coupon (code may exist)");
    resetCoupon();
    router.refresh();
  }
  function editCoupon(c: ManagedCoupon) {
    setEditingCouponId(c.id);
    setCode(c.code);
    setCType(c.type);
    setCValue(String(c.value / 100));
    setCLimit(String(c.usageLimit));
    setError(null);
  }
  function resetCoupon() {
    setEditingCouponId(null);
    setCode("");
    setCValue("");
    setCLimit("0");
    setCType("percentage");
  }
  async function removeCoupon(id: string) {
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (editingCouponId === id) resetCoupon();
    router.refresh();
  }

  // ---- Discounts ----
  async function submitDiscount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (dScope === "category" && dCategoryIds.length === 0) return setError("Select at least one category for this discount.");
    if (dScope === "product" && dProductIds.length === 0) return setError("Select at least one product for this discount.");
    const url = editingDiscountId ? `/api/admin/discounts/${editingDiscountId}` : "/api/admin/discounts";
    const method = editingDiscountId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: { en: dName, ar: dName },
        type: dType,
        value: encodeValue(dType, dValue),
        scope: dScope,
        categoryIds: dScope === "category" ? dCategoryIds : [],
        productIds: dScope === "product" ? dProductIds : [],
      }),
    });
    if (!res.ok) return setError(editingDiscountId ? "Could not update discount" : "Could not create discount");
    resetDiscount();
    router.refresh();
  }
  function editDiscount(d: ManagedDiscount) {
    setEditingDiscountId(d.id);
    setDName(d.nameEn);
    setDType(d.type);
    setDValue(String(d.value / 100));
    setDScope(d.scope as "all" | "category" | "product");
    setDCategoryIds(d.categoryIds);
    setDProductIds(d.productIds);
    setError(null);
  }
  function resetDiscount() {
    setEditingDiscountId(null);
    setDName("");
    setDValue("");
    setDType("percentage");
    setDScope("all");
    setDCategoryIds([]);
    setDProductIds([]);
  }
  async function removeDiscount(id: string) {
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    if (editingDiscountId === id) resetDiscount();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Coupons */}
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
                  <span className="ms-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editCoupon(c)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeCoupon(c.id)}>
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submitCoupon} className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                {editingCouponId ? "Save" : "Add coupon"}
              </Button>
              {editingCouponId && (
                <Button type="button" variant="outline" size="sm" onClick={resetCoupon}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Discounts */}
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
                  {d.scope === "category" && (
                    <span className="text-xs text-muted-fg">{d.categoryIds.map(categoryName).join(", ") || "—"}</span>
                  )}
                  {d.scope === "product" && (
                    <span className="text-xs text-muted-fg">{d.productIds.map(productName).join(", ") || "—"}</span>
                  )}
                  {!d.isActive && <Badge tone="danger">inactive</Badge>}
                  <span className="ms-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editDiscount(d)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeDiscount(d.id)}>
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submitDiscount} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            </div>

            {dScope === "category" && (
              <TargetPicker
                label="Apply to categories"
                options={categories}
                selected={dCategoryIds}
                onToggle={(id) =>
                  setDCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
              />
            )}
            {dScope === "product" && (
              <TargetPicker
                label="Apply to products"
                options={products}
                selected={dProductIds}
                onToggle={(id) =>
                  setDProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
              />
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                {editingDiscountId ? "Save changes" : "Add discount"}
              </Button>
              {editingDiscountId && (
                <Button type="button" variant="outline" size="sm" onClick={resetDiscount}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

/** Checkbox list for selecting the categories/products a discount targets. */
function TargetPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-fg">{label}</span>
      {options.length === 0 ? (
        <p className="text-xs text-muted-fg">None available.</p>
      ) : (
        <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-token border border-border p-2 sm:grid-cols-2 md:grid-cols-3">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => onToggle(o.id)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="truncate">{o.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
