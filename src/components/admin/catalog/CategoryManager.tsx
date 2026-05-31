"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge } from "@/components/ui";

export type ManagedCategory = { id: string; nameEn: string; nameAr: string; slug: string; isActive: boolean };

/** Create/list/delete categories (FR-018). */
export function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: { en: nameEn, ar: nameAr } }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create category");
      return;
    }
    setNameEn("");
    setNameAr("");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete (category may be in use)");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-fg">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-fg">{c.nameEn || c.slug}</span>
                  <span className="text-muted-fg" dir="rtl">
                    {c.nameAr}
                  </span>
                  {!c.isActive && <Badge tone="danger">inactive</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => remove(c.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
          <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          <div className="col-span-2">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Adding…" : "Add category"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
