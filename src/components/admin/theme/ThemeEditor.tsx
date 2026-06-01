"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Select, Card, CardBody } from "@/components/ui";

export type ThemeInitial = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  baseFontSizePx: number;
  layout: "classic" | "compact" | "wide";
  defaultMode: "light" | "dark";
  defaultLanguage: "ar" | "en";
};

/** Theme editor with a live preview (FR-027). Changes apply storefront-wide within ~1 min. */
export function ThemeEditor({ initial }: { initial: ThemeInitial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save theme");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Primary color">
              <Input type="color" value={v.primaryColor} onChange={(e) => setV({ ...v, primaryColor: e.target.value })} />
            </Field>
            <Field label="Secondary color">
              <Input
                type="color"
                value={v.secondaryColor}
                onChange={(e) => setV({ ...v, secondaryColor: e.target.value })}
              />
            </Field>
            <Field label="Font family">
              <Input value={v.fontFamily} onChange={(e) => setV({ ...v, fontFamily: e.target.value })} />
            </Field>
            <Field label="Base font size (px)">
              <Input
                type="number"
                min="10"
                max="24"
                value={v.baseFontSizePx}
                onChange={(e) => setV({ ...v, baseFontSizePx: Number(e.target.value) })}
              />
            </Field>
            <Field label="Layout">
              <Select value={v.layout} onChange={(e) => setV({ ...v, layout: e.target.value as ThemeInitial["layout"] })}>
                <option value="classic">Classic</option>
                <option value="compact">Compact</option>
                <option value="wide">Wide</option>
              </Select>
            </Field>
            <Field label="Default mode">
              <Select
                value={v.defaultMode}
                onChange={(e) => setV({ ...v, defaultMode: e.target.value as ThemeInitial["defaultMode"] })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </Field>
            <Field label="Default language">
              <Select
                value={v.defaultLanguage}
                onChange={(e) => setV({ ...v, defaultLanguage: e.target.value as ThemeInitial["defaultLanguage"] })}
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </Select>
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            {saved && <p className="text-sm text-success">Saved. Storefront updates within ~1 minute.</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save theme"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-semibold text-fg">Live preview</h2>
          <div
            className="space-y-3 rounded-token border border-border p-4"
            style={{ fontFamily: v.fontFamily, fontSize: `${v.baseFontSizePx}px` }}
          >
            <p className="font-bold" style={{ color: v.primaryColor }}>
              Heading sample
            </p>
            <p className="text-fg">Body text renders in the chosen font and size.</p>
            <div className="flex gap-2">
              <span
                className="inline-flex items-center rounded-token px-3 py-1.5 text-sm text-white"
                style={{ backgroundColor: v.primaryColor }}
              >
                Primary
              </span>
              <span
                className="inline-flex items-center rounded-token px-3 py-1.5 text-sm text-white"
                style={{ backgroundColor: v.secondaryColor }}
              >
                Secondary
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
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
