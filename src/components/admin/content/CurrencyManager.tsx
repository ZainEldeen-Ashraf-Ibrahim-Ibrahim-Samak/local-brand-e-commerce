"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Select, Card, CardBody } from "@/components/ui";

export type CurrencyOption = {
  code: string;
  labelEn: string;
  labelAr: string;
  symbol: string;
  rate: number;
};

export type CurrencyInitial = {
  base: string;
  active: string;
  options: CurrencyOption[];
};

const BLANK: CurrencyOption = { code: "", labelEn: "", labelAr: "", symbol: "", rate: 1 };

/** Admin manager for site currency + per-currency exchange rates (FR-007/FR-021). */
export function CurrencyManager({ initial }: { initial: CurrencyInitial }) {
  const router = useRouter();
  const [base, setBase] = useState(initial.base || "USD");
  const [active, setActive] = useState(initial.active || initial.base || "USD");
  const [options, setOptions] = useState<CurrencyOption[]>(
    initial.options.length ? initial.options : [{ ...BLANK, code: "USD", labelEn: "US Dollar", symbol: "$", rate: 1 }],
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setOption(i: number, patch: Partial<CurrencyOption>) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  const addRow = () => setOptions((p) => [...p, { ...BLANK }]);
  const removeRow = (i: number) => setOptions((p) => p.filter((_, idx) => idx !== i));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    // Client-side guards mirroring the server validation for a friendlier message.
    if (!options.some((o) => o.code === active)) {
      setError("Active currency must be one of the listed currencies.");
      return;
    }
    if (options.find((o) => o.code === base)?.rate !== 1) {
      setError("The base currency must have a rate of exactly 1.");
      return;
    }
    setBusy(true);
    const norm = (c: string) => c.replace(/[^A-Za-z]/g, "").toUpperCase();
    const payload = {
      base: norm(base),
      active: norm(active),
      options: options.map((o) => ({
        // ISO 4217 codes are letters only; strip stray characters so Intl never breaks.
        code: o.code.replace(/[^A-Za-z]/g, "").toUpperCase(),
        label: { en: o.labelEn, ar: o.labelAr },
        symbol: o.symbol,
        rate: Number(o.rate),
      })),
    };
    const res = await fetch("/api/admin/currency", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save currency (check codes and rates).");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-base font-semibold text-fg">Site currency</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-fg">Base currency (prices are stored in this)</span>
              <Select value={base} onChange={(e) => setBase(e.target.value)}>
                {options.map((o) => (
                  <option key={o.code} value={o.code}>{o.code || "—"}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-fg">Active currency (shown to shoppers)</span>
              <Select value={active} onChange={(e) => setActive(e.target.value)}>
                {options.map((o) => (
                  <option key={o.code} value={o.code}>{o.code || "—"}</option>
                ))}
              </Select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg">Currencies & rates</span>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>Add currency</Button>
            </div>
            <ul className="space-y-2">
              {options.map((o, i) => (
                <li key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <Input placeholder="Code (USD)" value={o.code} onChange={(e) => setOption(i, { code: e.target.value })} />
                  <Input placeholder="Symbol ($)" value={o.symbol} onChange={(e) => setOption(i, { symbol: e.target.value })} />
                  <Input placeholder="Label EN" value={o.labelEn} onChange={(e) => setOption(i, { labelEn: e.target.value })} />
                  <Input placeholder="Label AR" dir="rtl" value={o.labelAr} onChange={(e) => setOption(i, { labelAr: e.target.value })} />
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Rate"
                    value={o.rate}
                    onChange={(e) => setOption(i, { rate: Number(e.target.value) })}
                  />
                  <Button type="button" variant="danger" size="sm" onClick={() => removeRow(i)} disabled={options.length <= 1}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-fg">
              Rate = how many units of this currency equal 1 unit of the base currency. The base currency&apos;s rate must be 1.
            </p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Saved.</p>}
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save currency"}</Button>
        </form>
      </CardBody>
    </Card>
  );
}
