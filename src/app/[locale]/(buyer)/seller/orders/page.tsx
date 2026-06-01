import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listOwnOrders } from "@/services/buyer.service";
import { Card, CardBody, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Buyer (seller) orders — orders containing the seller's products only (FR-029). */
export default async function SellerOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const orders = await listOwnOrders(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">My orders</h1>
      <Card>
        <CardBody>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-fg">No orders for your products yet.</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-fg">
                  <th className="py-2 text-start font-medium">Order</th>
                  <th className="py-2 text-start font-medium">Total</th>
                  <th className="py-2 text-start font-medium">Status</th>
                  <th className="py-2 text-start font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border">
                    <td className="py-2 font-medium text-fg">{o.orderNumber}</td>
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
