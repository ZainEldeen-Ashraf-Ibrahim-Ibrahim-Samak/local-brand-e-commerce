"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, Badge, MediaUploader } from "@/components/ui";
import { mediaUrl } from "@/lib/media/cloudinary-url";
import type { MediaRef } from "@/lib/shared/types";

export type ManagedCategory = {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  image?: MediaRef | null;
};

/**
 * Create/list/delete/edit categories (FR-018, FR-203).
 * All mutations go through /api/admin/categories which requires requireRole("admin") — this
 * component is only rendered inside the admin layout and its action buttons carry
 * data-testid="admin-action" for test verification (T033).
 */
export function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [image, setImage] = useState<MediaRef | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const isEdit = Boolean(editingId);
    const url = isEdit ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: { en: nameEn, ar: nameAr },
        image,
      }),
    });

    setBusy(false);
    if (!res.ok) {
      setError(isEdit ? "Could not update category" : "Could not create category");
      return;
    }

    setNameEn("");
    setNameAr("");
    setImage(null);
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete (category may be in use)");
      return;
    }
    router.refresh();
  }

  async function toggleActive(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}/toggle`, { method: "POST" });
    if (!res.ok) {
      setError("Could not update");
      return;
    }
    router.refresh();
  }

  function startEdit(cat: ManagedCategory) {
    setEditingId(cat.id);
    setNameEn(cat.nameEn);
    setNameAr(cat.nameAr);
    setImage(cat.image || null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setNameEn("");
    setNameAr("");
    setImage(null);
    setError(null);
  }

  return (
    <Card>
      <CardBody className="space-y-6">
        {/* T033: admin-only badge makes the scope explicit in the UI */}
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-fg">Categories</h2>
          <Badge tone="warning">Admin only</Badge>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-fg">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border" data-testid="category-list">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  {c.image && (
                    <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(c.image, 80)}
                        alt={c.nameEn}
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
                      <span className="font-medium text-fg">{c.nameEn || c.slug}</span>
                      <span className="text-muted-fg text-xs" dir="rtl">
                        ({c.nameAr})
                      </span>
                      {!c.isActive && <Badge tone="danger">inactive</Badge>}
                    </div>
                    <span className="text-xs text-muted-fg">/{c.slug}</span>
                  </div>
                </div>
                {/* T033: data-testid marks these as admin-only affordances */}
                <div className="flex items-center gap-2" data-testid="admin-action">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(c.id)}>
                    {c.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(c)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(c.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border pt-4 space-y-4" data-testid="admin-category-form">
          <h3 className="text-sm font-semibold text-fg">
            {editingId ? "Edit Category" : "Add New Category"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Name (EN)"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
            />
            <Input
              placeholder="Name (AR)"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              dir="rtl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Category Image</label>
            <MediaUploader
              value={image}
              onChange={(v) => setImage(Array.isArray(v) ? (v[0] ?? null) : v)}
              multiple={false}
              folder="categories"
              onUploadingStateChange={setUploading}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={busy || uploading}>
              {busy ? "Saving…" : uploading ? "Uploading…" : editingId ? "Save Changes" : "Add Category"}
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
