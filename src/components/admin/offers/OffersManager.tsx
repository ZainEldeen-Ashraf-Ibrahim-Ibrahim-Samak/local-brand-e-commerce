"use client";

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge } from "@/components/ui";

export type ManagedOffer = {
  id: string;
  titleEn: string;
  titleAr: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
};

/** Create / reorder / toggle / delete homepage slider slides (FR-024). */
export function OffersManager({ offers }: { offers: ManagedOffer[] }) {
  const router = useRouter();
  const [list, setList] = useState(offers);
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: { en: titleEn, ar: titleAr }, ctaHref }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create slide");
      return;
    }
    setTitleEn("");
    setTitleAr("");
    setCtaHref("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setList(next);
    await fetch("/api/admin/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((o) => o.id) }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {list.length === 0 ? (
          <p className="text-sm text-muted-fg">No slides yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((o, i) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-medium text-fg">{o.titleEn || o.titleAr || "(untitled)"}</span>
                {!o.isActive && <Badge tone="danger">inactive</Badge>}
                {o.ctaHref && <span className="text-muted-fg">{o.ctaHref}</span>}
                <div className="ms-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                    ↓
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggle(o.id, !o.isActive)}>
                    {o.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(o.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={create} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input placeholder="Title (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required />
          <Input placeholder="Title (AR)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
          <Input placeholder="CTA link (e.g. /products)" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
          <div className="md:col-span-3">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Adding…" : "Add slide"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
