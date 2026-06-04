import { listCoupons, listDiscounts } from "@/services/admin/promotions.admin.service";
import { listAdminCategories, listAdminProducts } from "@/services/admin/catalog.admin.service";
import {
  PromotionsManager,
  type ManagedCoupon,
  type ManagedDiscount,
} from "@/components/admin/promotions/PromotionsManager";
import { pickLocale, type LocalizedText } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin promotions UI — coupons + discounts (FR-023/FR-025). */
export default async function AdminPromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [coupons, discounts, categories, productList] = await Promise.all([
    listCoupons(),
    listDiscounts(),
    listAdminCategories(),
    listAdminProducts({ pageSize: 100 }),
  ]);
  const categoryOptions = categories.map((c) => ({ id: c.id, name: pickLocale(c.name, loc) || c.slug }));
  const productOptions = productList.items.map((p) => ({ id: p.id, name: pickLocale(p.name, loc) || p.slug }));

  const managedCoupons: ManagedCoupon[] = coupons.map((c) => ({
    id: String(c._id),
    code: c.code,
    type: c.type as "percentage" | "fixed",
    value: c.value,
    usedCount: c.usedCount,
    usageLimit: c.usageLimit,
    isActive: c.isActive,
  }));

  const managedDiscounts: ManagedDiscount[] = discounts.map((d) => ({
    id: String(d._id),
    nameEn: (d.name as LocalizedText).en,
    type: d.type as "percentage" | "fixed",
    value: d.value,
    scope: d.scope,
    categoryIds: (d.categoryIds ?? []).map((x) => String(x)),
    productIds: (d.productIds ?? []).map((x) => String(x)),
    isActive: d.isActive,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Promotions</h1>
      <PromotionsManager
        coupons={managedCoupons}
        discounts={managedDiscounts}
        categories={categoryOptions}
        products={productOptions}
      />
    </div>
  );
}
