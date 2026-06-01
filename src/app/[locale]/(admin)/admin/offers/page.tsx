import { listAdminOffers } from "@/services/admin/offers.admin.service";
import { OffersManager, type ManagedOffer } from "@/components/admin/offers/OffersManager";
import type { LocalizedText } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin offers / homepage slider manager (FR-024). */
export default async function AdminOffersPage() {
  const offers = await listAdminOffers();
  const managed: ManagedOffer[] = offers.map((o) => {
    const title = o.title as LocalizedText;
    return {
      id: String(o._id),
      titleEn: title.en,
      titleAr: title.ar,
      ctaHref: o.ctaHref ?? "",
      isActive: o.isActive,
      sortOrder: o.sortOrder,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Offers & homepage slider</h1>
      <OffersManager offers={managed} />
    </div>
  );
}
