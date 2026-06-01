"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Select, Card, CardBody, Badge } from "@/components/ui";

export type BuyerProductRow = {
  id: string;
  nameEn: string;
  status: string;
  basePriceMajor: string;
};

export type BuyerCategoryOption = { id: string; name: string };

/** Buyer self-service product create + status toggle (own products only, FR-029). */
export function BuyerProductManager({
  products,
  categories,
}: {
  products: BuyerProductRow[];
  categories: BuyerCategoryOption[];
}) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/buyer/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: { en: nameEn, ar: nameAr },
        category,
        basePrice: Math.round(Number(price) * 100),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create product");
      return;
    }
    setNameEn("");
    setNameAr("");
    setPrice("");
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/buyer/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-fg">You have no products yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-medium text-fg">{p.nameEn || "(untitled)"}</span>
                <span className="text-muted-fg">{p.basePriceMajor}</span>
                <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status}</Badge>
                <div className="ms-auto flex gap-2">
                  {p.status !== "published" ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(p.id, "published")}>
                      Publish
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setStatus(p.id, "unpublished")}>
                      Unpublish
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={create} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
          <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <div className="col-span-2 md:col-span-4">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Adding…" : "Add product"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
