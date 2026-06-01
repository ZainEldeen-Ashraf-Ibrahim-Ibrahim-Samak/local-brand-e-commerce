import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/catalog.service";
import { VariantPicker } from "@/components/product/VariantPicker";
import { pickLocale } from "@/lib/shared/types";
import { ImageWithFallback } from "@/components/ui";
import type { AppLocale } from "@/lib/config/env";

/** Product detail with gallery + variant selection (FR-004/FR-005). */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const name = pickLocale(product.name, locale as AppLocale);
  const description = pickLocale(product.description, locale as AppLocale);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-token bg-muted">
          <ImageWithFallback
            image={product.images[0]}
            alt={name}
            fill
            priority
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((img) => (
              <div key={img.cloudinaryId} className="relative aspect-square overflow-hidden rounded-token bg-muted">
                <ImageWithFallback image={img} alt={name} fill />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-fg">{name}</h1>
        <p className="whitespace-pre-line text-muted-fg">{description}</p>
        <VariantPicker product={product} locale={locale as AppLocale} />
      </div>
    </div>
  );
}
