import { getTaxShippingPolicy } from "@/services/settings.service";
import {
  TaxShippingForm,
  type TaxShippingInitial,
  type ShippingOptionRow,
} from "@/components/admin/taxshipping/TaxShippingForm";
import type { LocalizedText } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin tax & shipping settings UI (FR-028). */
export default async function AdminTaxShippingPage() {
  const policy = await getTaxShippingPolicy();
  const options: ShippingOptionRow[] = (policy.shippingOptions ?? []).map((o) => {
    const label = (o.label ?? { en: "", ar: "" }) as LocalizedText;
    return {
      id: o.id,
      labelEn: label.en,
      labelAr: label.ar,
      costMajor: (o.cost / 100).toFixed(2),
      isActive: o.isActive,
    };
  });

  const initial: TaxShippingInitial = {
    taxRatePercent: String((policy.tax?.rateBasisPoints ?? 0) / 100),
    taxInclusive: policy.tax?.inclusive ?? false,
    options,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Tax & shipping</h1>
      <TaxShippingForm initial={initial} />
    </div>
  );
}
