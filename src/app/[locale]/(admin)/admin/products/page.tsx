import { Link } from "@/i18n/navigation";
import { listAdminProducts, listAdminCategories } from "@/services/admin/catalog.admin.service";
import { Card, CardBody, Badge, Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin product list (FR-018). Links to create + edit. */
export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [{ items }, categories] = await Promise.all([listAdminProducts({ pageSize: 100 }), listAdminCategories()]);
  const catName = new Map(categories.map((c) => [c.id, pickLocale(c.name, loc) || c.slug]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Products</h1>
        <Link href="/admin/products/new">
          <Button>New product</Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          {items.length === 0 ? (
            <p className="text-sm text-muted-fg">No products yet.</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-fg">
                  <th className="py-2 text-start font-medium">Name</th>
                  <th className="py-2 text-start font-medium">Category</th>
                  <th className="py-2 text-start font-medium">Price</th>
                  <th className="py-2 text-start font-medium">Variations</th>
                  <th className="py-2 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border">
                    <td className="py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-fg hover:text-primary">
                        {pickLocale(p.name, loc) || p.slug}
                      </Link>
                    </td>
                    <td className="py-2 text-fg">{catName.get(p.category) ?? "—"}</td>
                    <td className="py-2 text-fg">{formatMoney(p.basePrice, loc)}</td>
                    <td className="py-2 text-fg">{p.variationCount}</td>
                    <td className="py-2">
                      <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status}</Badge>
                    </td>
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
