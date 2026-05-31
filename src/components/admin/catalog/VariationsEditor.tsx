"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge } from "@/components/ui";

export type EditorVariation = {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceMajor: string;
  stock: number;
  isActive: boolean;
};

/** Manage a product's variations: add, edit stock/price, toggle active (FR-019). */
export function VariationsEditor({ productId, variations }: { productId: string; variations: EditorVariation[] }) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addVariation(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const options: Record<string, string> = {};
    if (size) options.size = size;
    if (color) options.color = color;
    const res = await fetch(`/api/admin/products/${productId}/variations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        options,
        priceOverride: price ? Math.round(Number(price) * 100) : undefined,
        stock: Number(stock) || 0,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not add variation (SKU may already exist)");
      return;
    }
    setSku("");
    setSize("");
    setColor("");
    setPrice("");
    setStock("0");
    router.refresh();
  }

  async function setStockValue(id: string, value: number) {
    await fetch(`/api/admin/variations/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set: value, reason: "admin manual adjust" }),
    });
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/variations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="font-semibold text-fg">Variations</h2>

        {variations.length === 0 ? (
          <p className="text-sm text-muted-fg">No variations yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {variations.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-mono text-fg">{v.sku}</span>
                <span className="text-muted-fg">
                  {[v.size, v.color].filter(Boolean).join(" / ") || "—"}
                </span>
                {!v.isActive && <Badge tone="danger">inactive</Badge>}
                {v.stock === 0 && <Badge tone="warning">out of stock</Badge>}
                <label className="ms-auto flex items-center gap-2">
                  <span className="text-muted-fg">Stock</span>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={v.stock}
                    className="h-8 w-20"
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (next !== v.stock) setStockValue(v.id, next);
                    }}
                  />
                </label>
                <Button variant="outline" size="sm" onClick={() => toggleActive(v.id, !v.isActive)}>
                  {v.isActive ? "Deactivate" : "Activate"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addVariation} className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
          <Input placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} />
          <Input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price override"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            type="number"
            min="0"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <div className="col-span-2 md:col-span-5">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Adding…" : "Add variation"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
