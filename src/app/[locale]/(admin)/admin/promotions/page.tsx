import { listCoupons, listDiscounts } from "@/services/admin/promotions.admin.service";
import {
  PromotionsManager,
  type ManagedCoupon,
  type ManagedDiscount,
} from "@/components/admin/promotions/PromotionsManager";
import type { LocalizedText } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin promotions UI — coupons + discounts (FR-023/FR-025). */
export default async function AdminPromotionsPage() {
  const [coupons, discounts] = await Promise.all([listCoupons(), listDiscounts()]);

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
    isActive: d.isActive,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Promotions</h1>
      <PromotionsManager coupons={managedCoupons} discounts={managedDiscounts} />
    </div>
  );
}
