import { getDashboardSummary } from "@/services/admin/dashboard.admin.service";
import { Card, CardBody, Badge } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin dashboard — sales + inventory at a glance (FR-021). */
export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const s = await getDashboardSummary();

  const stats = [
    { label: "Total orders", value: String(s.sales.totalOrders) },
    { label: "Revenue", value: formatMoney(s.sales.revenue, loc) },
    { label: "Published products", value: `${s.inventory.publishedProducts}/${s.inventory.totalProducts}` },
    { label: "Out of stock", value: String(s.inventory.outOfStock) },
    { label: "Low stock", value: String(s.inventory.lowStock) },
    { label: "Variations", value: String(s.inventory.totalVariations) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((st) => (
          <Card key={st.label}>
            <CardBody>
              <p className="text-sm text-muted-fg">{st.label}</p>
              <p className="mt-1 text-2xl font-semibold text-fg">{st.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-fg">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {s.sales.recent.length === 0 ? (
            <p className="text-sm text-muted-fg">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {s.sales.recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-fg hover:text-primary">
                    {o.orderNumber}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    <span className="text-fg">{formatMoney(o.grandTotal, loc)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
