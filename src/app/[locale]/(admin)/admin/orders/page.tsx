import { Link } from "@/i18n/navigation";
import { listAdminOrders } from "@/services/admin/orders.admin.service";
import { Card, CardBody, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin orders list (FR-020). */
export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const { items } = await listAdminOrders({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Orders</h1>
      <Card>
        <CardBody>
          {items.length === 0 ? (
            <p className="text-sm text-muted-fg">No orders yet.</p>
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
                {items.map((o) => (
                  <tr key={o.id} className="border-b border-border">
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-fg hover:text-primary">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-fg">{o.customerName || o.customerEmail}</td>
                    <td className="py-2 text-fg">{formatMoney(o.grandTotal, loc)}</td>
                    <td className="py-2">
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-fg">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
