"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge, MediaUploader } from "@/components/ui";
import type { MediaRef } from "@/lib/shared/types";

export type EditorVariation = {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceMajor: string;
  stock: number;
  isActive: boolean;
  image?: { cloudinaryId: string; version: string } | null;
};

/** Manage a product's variations: add, edit stock/price, toggle active, upload variation image (FR-019/FR-202a). */
export function VariationsEditor({ productId, variations }: { productId: string; variations: EditorVariation[] }) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [newImage, setNewImage] = useState<MediaRef | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-existing-variation image state (id → MediaRef|null)
  const [varImages, setVarImages] = useState<Record<string, MediaRef | null>>(() =>
    Object.fromEntries(
      variations.map((v) => [
        v.id,
        v.image ? { cloudinaryId: v.image.cloudinaryId, version: v.image.version } : null,
      ]),
    ),
  );
  const [varImageUploading, setVarImageUploading] = useState<Record<string, boolean>>({});

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
        image: newImage ?? undefined,
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
    setNewImage(null);
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

  async function setPriceOverride(id: string, valueMajor: string) {
    const trimmed = valueMajor.trim();
    // Empty input clears the override (falls back to product base price); a number sets it.
    const priceOverride = trimmed === "" ? null : Math.round(Number(trimmed) * 100);
    const res = await fetch(`/api/admin/variations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceOverride }),
    });
    if (!res.ok) {
      setError("Could not update price override");
      return;
    }
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

  async function saveVariationImage(id: string) {
    await fetch(`/api/admin/variations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: varImages[id] ?? null }),
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
              <li key={v.id} className="flex flex-col gap-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-fg">{v.sku}</span>
                  <span className="text-muted-fg">
                    {[v.size, v.color].filter(Boolean).join(" / ") || "—"}
                  </span>
                  {!v.isActive && <Badge tone="danger">inactive</Badge>}
                  {v.stock === 0 && <Badge tone="warning">out of stock</Badge>}
                  <label className="ms-auto flex items-center gap-2">
                    <span className="text-muted-fg">Price</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={v.priceMajor}
                      placeholder="base"
                      className="h-8 w-24"
                      title="Price override (leave empty to use the product base price)"
                      onBlur={(e) => {
                        if (e.target.value !== v.priceMajor) setPriceOverride(v.id, e.target.value);
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-2">
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
                </div>

                {/* T031: Per-variation image uploader (FR-202a) */}
                <div className="ms-2 space-y-1.5 border-s-2 border-border ps-3">
                  <p className="text-xs font-medium text-muted-fg">Variation image (optional — overrides product gallery when selected)</p>
                  <MediaUploader
                    value={varImages[v.id] ?? null}
                    onChange={(val) =>
                      setVarImages((prev) => ({
                        ...prev,
                        [v.id]: Array.isArray(val) ? (val[0] ?? null) : val,
                      }))
                    }
                    multiple={false}
                    folder="variations"
                    onUploadingStateChange={(uploading) =>
                      setVarImageUploading((prev) => ({ ...prev, [v.id]: uploading }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={varImageUploading[v.id]}
                    onClick={() => saveVariationImage(v.id)}
                  >
                    {varImageUploading[v.id] ? "Uploading…" : "Save image"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addVariation} className="space-y-3 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Add variation</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-fg">Variation image (optional)</p>
            <MediaUploader
              value={newImage}
              onChange={(v) => setNewImage(Array.isArray(v) ? (v[0] ?? null) : v)}
              multiple={false}
              folder="variations"
              onUploadingStateChange={setUploading}
            />
          </div>
          <div>
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={busy || uploading}>
              {busy ? "Adding…" : uploading ? "Uploading…" : "Add variation"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
