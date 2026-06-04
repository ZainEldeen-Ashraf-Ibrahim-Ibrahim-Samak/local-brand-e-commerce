"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImageWithFallback, Button } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency/CurrencyContext";
import { useCompare } from "@/lib/compare/useCompare";
import type { AppLocale } from "@/lib/config/env";

/** Side-by-side compare view (FR-015). Browser-local list, max 3 items. */
export default function ComparePage() {
  const t = useTranslations("compare");
  const locale = useLocale() as AppLocale;
  const currency = useDisplayCurrency();
  const { items, remove } = useCompare();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-fg">{t("title")}</h1>
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-fg">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-28 p-2 text-start align-bottom text-muted-fg">{t("attribute")}</th>
                {items.map((p) => (
                  <th key={p.productSlug} className="p-2 align-bottom">
                    <Link href={`/products/${p.productSlug}`} className="block space-y-2">
                      <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-token bg-muted">
                        <ImageWithFallback image={p.image} alt={pickLocale(p.name, locale)} fill className="object-cover" />
                      </div>
                      <span className="block font-medium text-fg">{pickLocale(p.name, locale)}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-2 font-medium text-muted-fg">{t("price")}</td>
                {items.map((p) => (
                  <td key={p.productSlug} className="p-2 text-center font-semibold text-primary">
                    {formatMoney(p.basePrice, locale, currency)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border">
                <td className="p-2" />
                {items.map((p) => (
                  <td key={p.productSlug} className="p-2 text-center">
                    <Button variant="outline" size="sm" onClick={() => remove(p.productSlug)}>
                      {t("remove")}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
