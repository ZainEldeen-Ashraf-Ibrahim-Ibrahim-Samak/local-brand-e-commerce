"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Select, Card, CardBody } from "@/components/ui";

export type ProductFormCategory = { id: string; name: string };

export type ProductFormInitial = {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  basePriceMajor: number;
  status: "draft" | "published" | "unpublished";
};

/** Create/edit a product. Prices are entered in major units and stored as minor units. */
export function ProductForm({
  categories,
  initial,
}: {
  categories: ProductFormCategory[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [descEn, setDescEn] = useState(initial?.descriptionEn ?? "");
  const [descAr, setDescAr] = useState(initial?.descriptionAr ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(initial?.basePriceMajor != null ? String(initial.basePriceMajor) : "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: { en: nameEn, ar: nameAr },
      description: { en: descEn, ar: descAr },
      category,
      basePrice: Math.round(Number(price) * 100),
      status,
    };
    const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save the product");
      return;
    }
    const saved = await res.json();
    router.push(`/admin/products/${isEdit ? initial!.id : saved._id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name (EN)">
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
            </Field>
            <Field label="Name (AR)">
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
            </Field>
            <Field label="Description (EN)">
              <Input value={descEn} onChange={(e) => setDescEn(e.target.value)} />
            </Field>
            <Field label="Description (AR)">
              <Input value={descAr} onChange={(e) => setDescAr(e.target.value)} dir="rtl" />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>
                  Select…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Base price (major units)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ProductFormInitial["status"])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </Select>
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-fg">{label}</span>
      {children}
    </label>
  );
}
