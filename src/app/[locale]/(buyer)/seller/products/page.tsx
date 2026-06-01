import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listOwnProducts } from "@/services/buyer.service";
import { listCategoryTree } from "@/services/catalog.service";
import {
  BuyerProductManager,
  type BuyerProductRow,
  type BuyerCategoryOption,
} from "@/components/buyer/BuyerProductManager";
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

  const [products, categories] = await Promise.all([listOwnProducts(session.user.id), listCategoryTree()]);

  const rows: BuyerProductRow[] = products.map((p) => ({
    id: p.id,
    nameEn: pickLocale(p.name, loc) || p.slug,
    status: p.status,
    basePriceMajor: formatMoney(p.basePrice, loc),
  }));
  const catOptions: BuyerCategoryOption[] = categories.map((c) => ({ id: c.id, name: pickLocale(c.name, loc) || c.slug }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">My products</h1>
      <BuyerProductManager products={rows} categories={catOptions} />
    </div>
  );
}
