"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency/CurrencyContext";
import { useCart } from "@/lib/cart/useCart";
import { pickLocale } from "@/lib/shared/types";
import type { ProductDetailDTO } from "@/services/catalog.service";
import type { AppLocale } from "@/lib/config/env";

export type { ProductDetailDTO };

/**
 * Variant selection + add-to-cart (FR-004/FR-005/FR-006).
 *
 * Controlled by the parent (ProductDetailClient): the selected `variationId`
 * and `onSelectVariation` are lifted up so selecting a variant and selecting its
 * gallery image stay in sync (FR-202b).
 */
export function VariantPicker({
  product,
  locale,
  variationId,
  onSelectVariation,
}: {
  product: ProductDetailDTO;
  locale: AppLocale;
  variationId: string;
  onSelectVariation: (id: string) => void;
}) {
  const t = useTranslations("common");
  const currency = useDisplayCurrency();
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => product.variations.find((v) => v.id === variationId),
    [product.variations, variationId],
  );

  if (product.variations.length === 0) {
    return <Badge tone="muted">{t("outOfStock")}</Badge>;
  }

  function onAdd() {
    if (!selected || !selected.inStock) return;
    add({
      variationId: selected.id,
      productSlug: product.slug,
      name: product.name,
      options: selected.options,
      // Store the LIST price; the server applies the discount at checkout (shown as a
      // Discount line) so totals stay self-consistent and never double-count.
      unitPrice: selected.price,
      quantity: 1,
      image: selected.image ?? product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {product.variations.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={!v.inStock}
            onClick={() => onSelectVariation(v.id)}
            className={[
              "rounded-token border px-3 py-1.5 text-sm transition",
              v.id === variationId ? "border-primary bg-primary text-primary-fg" : "border-border text-fg",
              !v.inStock ? "cursor-not-allowed opacity-40 line-through" : "hover:border-primary",
            ].join(" ")}
          >
            {Object.values(v.options).join(" / ") || v.sku}
          </button>
        ))}
      </div>

      {selected &&
        (selected.salePrice != null && selected.salePrice < selected.price ? (
          <p className="flex items-center gap-2">
            <span className="text-lg font-semibold text-danger">{formatMoney(selected.salePrice, locale, currency)}</span>
            <span className="text-sm text-muted-fg line-through">{formatMoney(selected.price, locale, currency)}</span>
          </p>
        ) : (
          <p className="text-lg font-semibold text-primary">{formatMoney(selected.price, locale, currency)}</p>
        ))}

      <Button onClick={onAdd} disabled={!selected?.inStock} size="lg">
        {selected?.inStock ? (added ? "✓" : t("addToCart")) : t("outOfStock")}
      </Button>

      {selected && !selected.inStock && (
        <p className="text-sm text-danger">{t("outOfStock")}</p>
      )}
      {/* options labels reference (keeps pickLocale used for attribute display) */}
      <div className="sr-only">
        {product.attributes.map((a) => pickLocale(a.label, locale)).join(", ")}
      </div>
    </div>
  );
}
