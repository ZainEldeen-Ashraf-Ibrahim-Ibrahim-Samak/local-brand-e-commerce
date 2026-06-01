"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Card, CardBody } from "@/components/ui";

export type ShippingOptionRow = {
  id: string;
  labelEn: string;
  labelAr: string;
  costMajor: string;
  isActive: boolean;
};

export type TaxShippingInitial = {
  taxRatePercent: string; // e.g. "14"
  taxInclusive: boolean;
  options: ShippingOptionRow[];
};

/** Edit tax rate + shipping options (FR-028). Percent → basis points, major → minor units. */
export function TaxShippingForm({ initial }: { initial: TaxShippingInitial }) {
  const router = useRouter();
  const [taxPercent, setTaxPercent] = useState(initial.taxRatePercent);
  const [inclusive, setInclusive] = useState(initial.taxInclusive);
  const [options, setOptions] = useState<ShippingOptionRow[]>(initial.options);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateOption(i: number, patch: Partial<ShippingOptionRow>) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function addOption() {
    setOptions((prev) => [
      ...prev,
      { id: `ship-${prev.length + 1}`, labelEn: "", labelAr: "", costMajor: "0", isActive: true },
    ]);
  }
  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      tax: {
        rateBasisPoints: Math.round(Number(taxPercent) * 100),
        inclusive,
        label: { en: "Tax", ar: "ضريبة" },
      },
      shippingOptions: options.map((o) => ({
        id: o.id,
        label: { en: o.labelEn, ar: o.labelAr },
        cost: Math.round(Number(o.costMajor) * 100),
        isActive: o.isActive,
      })),
    };
    const res = await fetch("/api/admin/tax-shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save tax & shipping");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-fg">Tax</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-fg">Rate (%)</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 self-end text-sm text-fg">
              <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />
              Prices include tax
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-fg">Shipping options</h2>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              Add option
            </Button>
          </div>
          {options.length === 0 && <p className="text-sm text-muted-fg">No shipping options.</p>}
          {options.map((o, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-3 md:grid-cols-5">
              <Input placeholder="ID" value={o.id} onChange={(e) => updateOption(i, { id: e.target.value })} />
              <Input
                placeholder="Label (EN)"
                value={o.labelEn}
                onChange={(e) => updateOption(i, { labelEn: e.target.value })}
              />
              <Input
                placeholder="Label (AR)"
                value={o.labelAr}
                dir="rtl"
                onChange={(e) => updateOption(i, { labelAr: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Cost"
                value={o.costMajor}
                onChange={(e) => updateOption(i, { costMajor: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm text-fg">
                  <input
                    type="checkbox"
                    checked={o.isActive}
                    onChange={(e) => updateOption(i, { isActive: e.target.checked })}
                  />
                  Active
                </label>
                <Button type="button" variant="outline" size="sm" onClick={() => removeOption(i)}>
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save tax & shipping"}
      </Button>
    </form>
  );
}
