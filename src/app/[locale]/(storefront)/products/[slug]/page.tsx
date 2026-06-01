import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/catalog.service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

/** Product detail with gallery + variant selection (FR-004/FR-005/FR-202b). */
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
    <div className="space-y-6">
      <ProductDetailClient product={product} locale={locale as AppLocale} name={name} />
      <p className="whitespace-pre-line text-muted-fg">{description}</p>
    </div>
  );
}
