"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody } from "@/components/ui";

export type SettingsInitial = {
  storeNameEn: string;
  storeNameAr: string;
  announcementEn: string;
  announcementAr: string;
  aboutEn: string;
  aboutAr: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactAddress: string;
  seoDescriptionEn: string;
  seoDescriptionAr: string;
};

/** Edit core website identity + content (FR-026). */
export function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SettingsInitial) => (e: { target: { value: string } }) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      storeName: { en: v.storeNameEn, ar: v.storeNameAr },
      header: { announcement: { en: v.announcementEn, ar: v.announcementAr }, navLinks: [] },
      aboutPage: { body: { en: v.aboutEn, ar: v.aboutAr } },
      contactPage: {
        body: { en: "", ar: "" },
        email: v.contactEmail,
        phone: v.contactPhone,
        whatsapp: v.contactWhatsapp,
        address: v.contactAddress,
      },
      seo: { description: { en: v.seoDescriptionEn, ar: v.seoDescriptionAr }, keywords: [] },
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save settings");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Store name (EN)">
              <Input value={v.storeNameEn} onChange={set("storeNameEn")} />
            </Field>
            <Field label="Store name (AR)">
              <Input value={v.storeNameAr} onChange={set("storeNameAr")} dir="rtl" />
            </Field>
            <Field label="Announcement (EN)">
              <Input value={v.announcementEn} onChange={set("announcementEn")} />
            </Field>
            <Field label="Announcement (AR)">
              <Input value={v.announcementAr} onChange={set("announcementAr")} dir="rtl" />
            </Field>
            <Field label="About (EN)">
              <Input value={v.aboutEn} onChange={set("aboutEn")} />
            </Field>
            <Field label="About (AR)">
              <Input value={v.aboutAr} onChange={set("aboutAr")} dir="rtl" />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={v.contactEmail} onChange={set("contactEmail")} />
            </Field>
            <Field label="Contact phone">
              <Input value={v.contactPhone} onChange={set("contactPhone")} />
            </Field>
            <Field label="WhatsApp">
              <Input value={v.contactWhatsapp} onChange={set("contactWhatsapp")} />
            </Field>
            <Field label="Address">
              <Input value={v.contactAddress} onChange={set("contactAddress")} />
            </Field>
            <Field label="SEO description (EN)">
              <Input value={v.seoDescriptionEn} onChange={set("seoDescriptionEn")} />
            </Field>
            <Field label="SEO description (AR)">
              <Input value={v.seoDescriptionAr} onChange={set("seoDescriptionAr")} dir="rtl" />
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Saved.</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
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
