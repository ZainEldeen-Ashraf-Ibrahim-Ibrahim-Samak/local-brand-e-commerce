import { requireRole } from "@/lib/auth/guards";
import { getCustomerDetail } from "@/services/admin/customers.admin.service";
import { Card, CardBody, Badge } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; email: string }>;
}) {
  await requireRole("admin");
  const { locale, email } = await params;
  const loc = locale as AppLocale;
  const decodedEmail = decodeURIComponent(email);

  let detail;
  try {
    detail = await getCustomerDetail(decodedEmail);
  } catch (err) {
    return (
      <div className="space-y-4">
        <Link href="/admin/customers" className="text-sm text-primary hover:underline">
          &larr; Back to customers
        </Link>
        <div className="rounded-token bg-danger-subtle p-4 text-sm text-danger border border-danger/20">
          Customer not found.
        </div>
      </div>
    );
  }

  const { customer, orders } = detail;

  // Aggregate values
  const orderCount = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin/customers" className="text-sm text-primary hover:underline">
          &larr; Back to customers
        </Link>
        <h1 className="text-2xl font-bold text-fg">Customer Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Customer Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-fg border-b border-border pb-2">
                Contact Details
              </h2>
              
              <div className="space-y-2 text-sm text-fg">
                <div>
                  <span className="block text-xs text-muted-fg font-medium">Name</span>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-fg font-medium">Email</span>
                  <span>{customer.email}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-fg font-medium">WhatsApp</span>
                  <span>{customer.whatsapp}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-2 text-center">
                <div className="bg-muted/30 p-2 rounded-token">
                  <span className="block text-xs text-muted-fg">Orders</span>
                  <span className="text-lg font-bold text-fg">{orderCount}</span>
                </div>
                <div className="bg-muted/30 p-2 rounded-token">
                  <span className="block text-xs text-muted-fg">Total Spend</span>
                  <span className="text-lg font-bold text-primary">{formatMoney(totalSpend, loc)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Order History */}
        <div className="md:col-span-2">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-fg">Order History</h2>

              {orders.length === 0 ? (
                <p className="text-sm text-muted-fg">No orders found for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-fg font-medium">
                        <th className="py-2 px-3">Order Number</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((o) => (
                        <tr key={o._id.toString()} className="text-fg hover:bg-bg/50">
                          <td className="py-3 px-3 font-semibold">
                            <Link
                              href={`/admin/orders/${o._id}`}
                              className="text-primary hover:underline"
                            >
                              {o.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-fg">
                            {new Date(o.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {formatMoney(o.grandTotal, loc)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
