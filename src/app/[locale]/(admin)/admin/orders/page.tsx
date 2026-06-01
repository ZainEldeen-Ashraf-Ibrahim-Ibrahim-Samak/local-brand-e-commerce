import { Link } from "@/i18n/navigation";
import { listAdminOrders } from "@/services/admin/orders.admin.service";
import { Card, CardBody, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

const COMPLETION_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed / Cancelled" },
] as const;

/** Returns minutes until expiry, or null if no expiresAt / already past. */
function minutesUntilExpiry(expiresAt?: Date | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / 60_000);
}

/** Admin orders list with completion-state filter tabs (FR-020, T023). */
export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const loc = locale as AppLocale;
  const completion = sp["completion"] ?? "";

  const { items } = await listAdminOrders({
    pageSize: 100,
    ...(completion ? { statuses: undefined } : {}),
  });

  // We pass completion= to the API route through client navigation,
  // but for SSR we filter in JS since the page is already fetching all.
  const completionFilter = COMPLETION_TABS.find((t) => t.key === completion);

  const COMPLETION_STATUS_MAP: Record<string, string[]> = {
    pending: ["pending"],
    completed: ["confirmed", "processing", "shipped", "delivered"],
    failed: ["cancelled", "failed", "returned", "refunded"],
  };

  const filteredItems = completion
    ? items.filter((o) => (COMPLETION_STATUS_MAP[completion] ?? []).includes(o.status))
    : items;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Orders</h1>

      {/* Completion-stage filter tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders by stage">
        {COMPLETION_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/orders?completion=${tab.key}` : "/admin/orders"}
            role="tab"
            aria-selected={completion === tab.key}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              completion === tab.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-fg hover:bg-muted/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardBody>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-fg">
              No orders{completionFilter?.label ? ` in "${completionFilter.label}"` : ""} yet.
            </p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-fg">
                  <th className="py-2 text-start font-medium">Order</th>
                  <th className="py-2 text-start font-medium">Customer</th>
                  <th className="py-2 text-start font-medium">Total</th>
                  <th className="py-2 text-start font-medium">Status</th>
                  <th className="py-2 text-start font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((o) => {
                  const expiryMins = minutesUntilExpiry(o.expiresAt);
                  return (
                    <tr key={o.id} className="border-b border-border">
                      <td className="py-2">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-medium text-fg hover:text-primary"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2 text-fg">{o.customerName || o.customerEmail}</td>
                      <td className="py-2 text-fg">{formatMoney(o.grandTotal, loc)}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                          {/* Expiry countdown — only for pending orders nearing expiry */}
                          {o.status === "pending" && expiryMins !== null && expiryMins <= 10 && (
                            <Badge tone="danger">
                              Expires in {expiryMins} min
                            </Badge>
                          )}
                          {o.status === "failed" &&
                            o.expiresAt &&
                            new Date(o.expiresAt) < new Date() && (
                              <Badge tone="muted">auto-expired</Badge>
                            )}
                        </div>
                      </td>
                      <td className="py-2 text-muted-fg">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
