"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardBody, ImageWithFallback, Button } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency/CurrencyContext";
import { useFavorites } from "@/lib/favorites/useFavorites";
import type { AppLocale } from "@/lib/config/env";

/** Shopper favorites list (FR-014). Browser-local; resolves nothing server-side. */
export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const locale = useLocale() as AppLocale;
  const currency = useDisplayCurrency();
  const { items, remove } = useFavorites();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-fg">{t("title")}</h1>
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-fg">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <Card key={p.productSlug} className="overflow-hidden">
              <Link href={`/products/${p.productSlug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <ImageWithFallback image={p.image} alt={pickLocale(p.name, locale)} fill className="object-cover" />
                </div>
              </Link>
              <CardBody className="space-y-2">
                <Link href={`/products/${p.productSlug}`} className="block">
                  <h3 className="line-clamp-2 text-sm font-medium text-fg">{pickLocale(p.name, locale)}</h3>
                  <p className="mt-1 text-sm font-semibold text-primary">{formatMoney(p.basePrice, locale, currency)}</p>
                </Link>
                <Button variant="outline" size="sm" onClick={() => remove(p.productSlug)}>
                  {t("remove")}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
