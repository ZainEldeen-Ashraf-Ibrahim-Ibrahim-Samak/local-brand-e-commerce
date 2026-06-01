import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listOwnProducts, listAllPublishedProducts } from "@/services/buyer.service";
import { listCategoryTree } from "@/services/catalog.service";
import {
  BuyerProductManager,
  type BuyerProductRow,
  type BuyerCategoryOption,
} from "@/components/buyer/BuyerProductManager";
import { Card, CardBody, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Buyer (seller) product management — own products only (FR-029). */
export default async function SellerProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const [products, allProducts, categories] = await Promise.all([
    listOwnProducts(session.user.id),
    listAllPublishedProducts(session.user.id),
    listCategoryTree(),
  ]);

  const rows: BuyerProductRow[] = products.map((p) => ({
    id: p.id,
    nameEn: pickLocale(p.name, loc) || p.slug,
    status: p.status,
    basePriceMajor: formatMoney(p.basePrice, loc),
  }));
  const catOptions: BuyerCategoryOption[] = categories.map((c) => ({ id: c.id, name: pickLocale(c.name, loc) || c.slug }));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-fg">My products</h1>
        <BuyerProductManager products={rows} categories={catOptions} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-fg">All products</h2>
          <p className="text-sm text-muted-fg">Browse the full published catalog. You can only edit your own.</p>
        </div>
        <Card>
          <CardBody>
            {allProducts.length === 0 ? (
              <p className="text-sm text-muted-fg">No published products yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {allProducts.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="font-medium text-fg">{pickLocale(p.name, loc) || p.slug}</span>
                    <span className="text-muted-fg">{formatMoney(p.basePrice, loc)}</span>
                    {p.mine && <Badge tone="success">Mine</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
