"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Select } from "@/components/ui";

/** Transition an order to an allowed next status (FR-036) and notify the customer (FR-014). */
export function OrderStatusControl({
  orderId,
  allowed,
}: {
  orderId: string;
  allowed: string[];
}) {
  const router = useRouter();
  const [to, setTo] = useState(allowed[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowed.length === 0) {
    return <p className="text-sm text-muted-fg">No further transitions available.</p>;
  }

  async function apply() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Transition not allowed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Select value={to} onChange={(e) => setTo(e.target.value)} className="w-48">
          {allowed.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={apply} disabled={busy}>
          {busy ? "Updating…" : "Update status"}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
