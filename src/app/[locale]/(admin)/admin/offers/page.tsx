import { listAdminOffers } from "@/services/admin/offers.admin.service";
import { OffersManager, type ManagedOffer } from "@/components/admin/offers/OffersManager";
import type { LocalizedText } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin offers / homepage slider manager (FR-024). */
export default async function AdminOffersPage() {
  const offers = await listAdminOffers();
  const managed: ManagedOffer[] = offers.map((o) => {
    const title = o.title as LocalizedText;
    const rawImg = o.image as
      | { cloudinaryId?: string | null; version?: string | null; alt?: { en?: string | null; ar?: string | null } | null }
      | null
      | undefined;

    // Only pass a MediaRef when both required fields are present (lean() may return partial shapes)
    const image: ManagedOffer["image"] =
      rawImg?.cloudinaryId && rawImg?.version
        ? {
            cloudinaryId: rawImg.cloudinaryId,
            version: rawImg.version,
            alt: rawImg.alt
              ? { en: rawImg.alt.en ?? "", ar: rawImg.alt.ar ?? "" }
              : undefined,
          }
        : null;

    return {
      id: String(o._id),
      titleEn: title.en,
      titleAr: title.ar,
      ctaHref: o.ctaHref ?? "",
      isActive: o.isActive,
      sortOrder: o.sortOrder,
      image,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Offers & homepage slider</h1>
      <OffersManager offers={managed} />
    </div>
  );
}
