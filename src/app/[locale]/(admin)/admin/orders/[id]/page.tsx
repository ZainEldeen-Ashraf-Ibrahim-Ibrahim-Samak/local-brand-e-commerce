import { getAdminOrder, allowedTransitions } from "@/services/admin/orders.admin.service";
import { OrderStatusControl } from "@/components/admin/orders/OrderStatusControl";
import { Card, CardBody, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { statusTone } from "@/components/admin/orders/statusTone";
import { pickLocale, type LocalizedText, type OrderStatus } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin order detail + status history + validated transition control (FR-020/FR-036). */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale as AppLocale;
  const order = await getAdminOrder(id);
  const allowed = allowedTransitions(order.status as OrderStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">{order.orderNumber}</h1>
        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-fg">Items</h2>
            <ul className="divide-y divide-border text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span className="text-fg">
                    {pickLocale(it.productNameSnapshot as LocalizedText, loc)} × {it.quantity}
                  </span>
                  <span className="text-fg">{formatMoney(it.lineTotal, loc)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal, loc)} />
              {order.discountTotal > 0 && <Row label="Discount" value={`- ${formatMoney(order.discountTotal, loc)}`} />}
              <Row label="Tax" value={formatMoney(order.taxTotal, loc)} />
              <Row label="Shipping" value={formatMoney(order.shippingOption?.cost ?? 0, loc)} />
              <Row label="Total" value={formatMoney(order.grandTotal, loc)} strong />
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-2 text-sm">
              <h2 className="font-semibold text-fg">Customer</h2>
              <p className="text-fg">{order.customer?.name}</p>
              <p className="text-muted-fg">{order.customer?.email}</p>
              <p className="text-muted-fg">{order.customer?.whatsapp}</p>
              <div className="border-t border-border pt-2">
                <p className="text-fg">{order.shippingAddress?.line1}</p>
                {order.shippingAddress?.line2 && <p className="text-fg">{order.shippingAddress.line2}</p>}
                <p className="text-muted-fg">
                  {[order.shippingAddress?.city, order.shippingAddress?.country].filter(Boolean).join(", ")}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <h2 className="font-semibold text-fg">Update status</h2>
              <OrderStatusControl orderId={String(order._id)} allowed={allowed} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-2">
          <h2 className="font-semibold text-fg">History</h2>
          <ul className="space-y-1 text-sm">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-muted-fg">
                <span className="text-fg">{h.to}</span>
                <span>· {new Date(h.at).toLocaleString()}</span>
                {h.note && <span>· {h.note}</span>}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-fg">{label}</dt>
      <dd className={strong ? "font-semibold text-fg" : "text-fg"}>{value}</dd>
    </div>
  );
}
