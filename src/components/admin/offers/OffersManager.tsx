"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge, MediaUploader } from "@/components/ui";
import { mediaUrl } from "@/lib/media/cloudinary-url";
import type { MediaRef } from "@/lib/shared/types";

export type ManagedOffer = {
  id: string;
  titleEn: string;
  titleAr: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
  image?: MediaRef | null;
};

/** Create / edit / reorder / toggle / delete homepage slider slides (FR-024, FR-204). */
export function OffersManager({ offers }: { offers: ManagedOffer[] }) {
  const router = useRouter();
  const [list, setList] = useState(offers);
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [image, setImage] = useState<MediaRef | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when props change
  if (offers.length !== list.length || offers.some((o, idx) => o.id !== list[idx]?.id || o.isActive !== list[idx]?.isActive)) {
    setList(offers);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const isEdit = Boolean(editingId);
    const url = isEdit ? `/api/admin/offers/${editingId}` : "/api/admin/offers";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: { en: titleEn, ar: titleAr },
        ctaHref,
        image,
      }),
    });

    setBusy(false);
    if (!res.ok) {
      setError(isEdit ? "Could not update slide" : "Could not create slide");
      return;
    }

    setTitleEn("");
    setTitleAr("");
    setCtaHref("");
    setImage(null);
    setEditingId(null);
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    setError(null);
    await fetch(`/api/admin/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    setError(null);
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

  function startEdit(offer: ManagedOffer) {
    setEditingId(offer.id);
    setTitleEn(offer.titleEn);
    setTitleAr(offer.titleAr);
    setCtaHref(offer.ctaHref);
    setImage(offer.image || null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitleEn("");
    setTitleAr("");
    setCtaHref("");
    setImage(null);
    setError(null);
  }

  return (
    <Card>
      <CardBody className="space-y-6">
        {list.length === 0 ? (
          <p className="text-sm text-muted-fg">No slides yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((o, i) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                {o.image && (
                  <div className="h-10 w-20 overflow-hidden rounded bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(o.image, 160)}
                      alt={o.titleEn}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-fg">{o.titleEn || o.titleAr || "(untitled)"}</span>
                    {!o.isActive && <Badge tone="danger">inactive</Badge>}
                  </div>
                  {o.ctaHref && <span className="text-muted-fg text-xs">{o.ctaHref}</span>}
                </div>
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
                  <Button variant="outline" size="sm" onClick={() => startEdit(o)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(o.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-fg">
            {editingId ? "Edit Slide" : "Add New Slide"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Title (EN)"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              required
            />
            <Input
              placeholder="Title (AR)"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              dir="rtl"
              required
            />
            <Input
              placeholder="CTA link (e.g. /products)"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Slide Image</label>
            <MediaUploader
              value={image}
              onChange={(v) => setImage(Array.isArray(v) ? (v[0] ?? null) : v)}
              multiple={false}
              folder="offers"
              onUploadingStateChange={setUploading}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={busy || uploading}>
              {busy ? "Saving…" : uploading ? "Uploading…" : editingId ? "Save Changes" : "Add Slide"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </CardBody>
    </Card>
  );
}
