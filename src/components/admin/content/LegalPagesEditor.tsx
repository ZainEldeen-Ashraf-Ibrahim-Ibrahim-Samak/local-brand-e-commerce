"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardBody } from "@/components/ui";

export type LegalInitial = {
  privacyEn: string;
  privacyAr: string;
  termsEn: string;
  termsAr: string;
};

/** Admin editor for the Privacy Policy and Terms & Conditions pages (FR-004). */
export function LegalPagesEditor({ initial }: { initial: LegalInitial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof LegalInitial) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      privacyPage: { body: { en: v.privacyEn, ar: v.privacyAr } },
      termsPage: { body: { en: v.termsEn, ar: v.termsAr } },
    };
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save legal pages");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-base font-semibold text-fg">Legal pages</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Area label="Privacy Policy (EN)" value={v.privacyEn} onChange={set("privacyEn")} />
            <Area label="Privacy Policy (AR)" value={v.privacyAr} onChange={set("privacyAr")} dir="rtl" />
            <Area label="Terms & Conditions (EN)" value={v.termsEn} onChange={set("termsEn")} />
            <Area label="Terms & Conditions (AR)" value={v.termsAr} onChange={set("termsAr")} dir="rtl" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Saved.</p>}
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save legal pages"}</Button>
        </form>
      </CardBody>
    </Card>
  );
}

function Area({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  dir?: "rtl";
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-fg">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        dir={dir}
        rows={8}
        className="w-full rounded-token border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      />
    </label>
  );
}
