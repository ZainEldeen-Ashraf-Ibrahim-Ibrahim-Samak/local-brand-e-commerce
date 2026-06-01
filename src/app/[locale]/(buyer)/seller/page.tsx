import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listOwnProducts, listOwnOrders } from "@/services/buyer.service";
import { Card, CardBody } from "@/components/ui";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

/** Buyer (seller) dashboard — own product + order counts (FR-029). */
export default async function SellerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const [products, orders] = await Promise.all([
    listOwnProducts(session.user.id),
    listOwnOrders(session.user.id),
  ]);
  const published = products.filter((p) => p.status === "published").length;

  const stats = [
    { label: "My products", value: String(products.length), href: "/seller/products" },
    { label: "Published", value: String(published), href: "/seller/products" },
    { label: "My orders", value: String(orders.length), href: "/seller/orders" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Seller dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-fg">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold text-fg">{s.value}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
