"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { pickLocale } from "@/lib/shared/types";
import type { ProductDetailDTO } from "@/services/catalog.service";
import type { AppLocale } from "@/lib/config/env";
import type { MediaRef } from "@/lib/shared/types";

/**
 * Client shell that keeps the gallery and variant selection in sync (FR-202b):
 *  - selecting a variation switches the gallery to that variation's image, and
 *  - clicking a variation's image selects that variation.
 * Also renders the category link + product title above the variant picker.
 */
export function ProductDetailClient({
  product,
  locale,
  name,
}: {
  product: ProductDetailDTO;
  locale: AppLocale;
  name: string;
}) {
  // Unified gallery: each variation image (tagged with its variationId) first,
  // then the product gallery images. Deduped by cloudinaryId.
  const gallery = useMemo(() => {
    const items: { image: MediaRef; variationId?: string }[] = [];
    const seen = new Set<string>();
    for (const v of product.variations) {
      const id = v.image?.cloudinaryId;
      if (id && !seen.has(id)) {
        seen.add(id);
        items.push({ image: v.image as MediaRef, variationId: v.id });
      }
    }
    for (const img of product.images) {
      if (img?.cloudinaryId && !seen.has(img.cloudinaryId)) {
        seen.add(img.cloudinaryId);
        items.push({ image: img });
      }
    }
    return items;
  }, [product]);

  const indexForVariation = (id: string) => {
    const v = product.variations.find((vv) => vv.id === id);
    if (!v?.image?.cloudinaryId) return -1;
    return gallery.findIndex((g) => g.image.cloudinaryId === v.image!.cloudinaryId);
  };

  const firstVariationId =
    product.variations.find((v) => v.inStock)?.id ?? product.variations[0]?.id ?? "";

  const [variationId, setVariationId] = useState(firstVariationId);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const i = indexForVariation(firstVariationId);
    return i >= 0 ? i : 0;
  });

  // Selecting a variation → switch the gallery to its image (if it has one).
  function handleSelectVariation(id: string) {
    setVariationId(id);
    const i = indexForVariation(id);
    if (i >= 0) setSelectedIndex(i);
  }

  // Selecting an image that belongs to a variation → select that variation.
  function handleSelectImage(index: number) {
    setSelectedIndex(index);
    const variationOfImage = gallery[index]?.variationId;
    if (variationOfImage) setVariationId(variationOfImage);
  }

  const images = gallery.map((g) => g.image);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={images} alt={name} selectedIndex={selectedIndex} onSelect={handleSelectImage} />

      <div className="space-y-6">
        <div className="space-y-1">
          {product.category && (
            <Link
              href={{ pathname: "/products", query: { category: product.category.slug } }}
              className="text-sm font-medium text-primary hover:underline"
            >
              {pickLocale(product.category.name, locale)}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-fg">{name}</h1>
        </div>

        <VariantPicker
          product={product}
          locale={locale}
          variationId={variationId}
          onSelectVariation={handleSelectVariation}
        />
      </div>
    </div>
  );
}
