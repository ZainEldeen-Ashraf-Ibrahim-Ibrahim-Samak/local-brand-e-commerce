"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody, MediaUploader } from "@/components/ui";
import type { MediaRef } from "@/lib/shared/types";

export type HeroInitial = {
  background: MediaRef | null;
  headingEn: string;
  headingAr: string;
  subtextEn: string;
  subtextAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  ctaHref: string;
  showHeading: boolean;
  showSubtext: boolean;
  showCta: boolean;
};

/** Admin editor for the home hero: full-bleed background + toggleable overlay components (FR-005). */
export function HeroEditor({ initial }: { initial: HeroInitial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [background, setBackground] = useState<MediaRef | null>(initial.background);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof HeroInitial) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (k: "showHeading" | "showSubtext" | "showCta") =>
    setV((p) => ({ ...p, [k]: !p[k] }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      background: background ?? undefined,
      heading: { en: v.headingEn, ar: v.headingAr },
      subtext: { en: v.subtextEn, ar: v.subtextAr },
      cta: { label: { en: v.ctaLabelEn, ar: v.ctaLabelAr }, href: v.ctaHref },
      showHeading: v.showHeading,
      showSubtext: v.showSubtext,
      showCta: v.showCta,
    };
    const res = await fetch("/api/admin/content/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save hero");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-base font-semibold text-fg">Home hero</h2>
          <label className="space-y-1 text-sm">
            <span className="text-fg">Background image (full-bleed)</span>
            <MediaUploader
              value={background}
              onChange={(val) => setBackground((Array.isArray(val) ? val[0] : val) ?? null)}
              folder="hero"
              onUploadingStateChange={setUploading}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Heading (EN)"><Input value={v.headingEn} onChange={set("headingEn")} /></Field>
            <Field label="Heading (AR)"><Input value={v.headingAr} onChange={set("headingAr")} dir="rtl" /></Field>
            <Field label="Subtext (EN)"><Input value={v.subtextEn} onChange={set("subtextEn")} /></Field>
            <Field label="Subtext (AR)"><Input value={v.subtextAr} onChange={set("subtextAr")} dir="rtl" /></Field>
            <Field label="CTA label (EN)"><Input value={v.ctaLabelEn} onChange={set("ctaLabelEn")} /></Field>
            <Field label="CTA label (AR)"><Input value={v.ctaLabelAr} onChange={set("ctaLabelAr")} dir="rtl" /></Field>
            <Field label="CTA link"><Input value={v.ctaHref} onChange={set("ctaHref")} placeholder="/products" /></Field>
          </div>
          <fieldset className="flex flex-wrap gap-4 text-sm">
            <Check label="Show heading" checked={v.showHeading} onChange={() => toggle("showHeading")} />
            <Check label="Show subtext" checked={v.showSubtext} onChange={() => toggle("showSubtext")} />
            <Check label="Show CTA" checked={v.showCta} onChange={() => toggle("showCta")} />
          </fieldset>
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Saved.</p>}
          <Button type="submit" disabled={busy || uploading}>
            {busy ? "Saving…" : uploading ? "Uploading…" : "Save hero"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-fg">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[var(--color-primary)]" />
      {label}
    </label>
  );
}
