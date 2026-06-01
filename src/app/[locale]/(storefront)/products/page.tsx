import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel } from "@/components/product/FilterPanel";
import { listProducts, listCategoryTree, type CatalogQuery } from "@/services/catalog.service";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Catalog listing with filters/search/facets (FR-001/FR-002/FR-003). */
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("nav");

  const query: CatalogQuery = {
    categorySlug: sp.category,
    q: sp.q,
    size: sp.size,
    color: sp.color,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    sort: sp.sort as CatalogQuery["sort"],
    page: sp.page ? Number(sp.page) : 1,
  };
  const [{ items, total, facets }, categoryTree] = await Promise.all([
    listProducts(query),
    listCategoryTree(),
  ]);
  const categories = categoryTree.map((c) => ({
    slug: c.slug,
    label: pickLocale(c.name, locale as AppLocale) || c.slug,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">{t("products")}</h1>
        <span className="text-sm text-muted-fg">{total}</span>
      </div>

      <FilterPanel sizes={facets.sizes} colors={facets.colors} categories={categories} />

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-fg">—</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale as AppLocale} />
          ))}
        </div>
      )}
    </div>
  );
}
