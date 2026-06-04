import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroSection } from "@/components/storefront/HeroSection";
import { HomeSlider } from "@/components/storefront/HomeSlider";
import { listProducts, listCategoryTree } from "@/services/catalog.service";
import { getHome } from "@/services/home.service";
import { getActiveCurrency } from "@/services/currency.service";
import { ImageWithFallback } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** How many categories get their own product row, and how many products per row. */
const CATEGORY_LIMIT = 6;
const PER_CATEGORY = 4;

/** Storefront home — category strip, per-category product rows, then all products (FR-001). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const t = await getTranslations("nav");

  const categories = (await listCategoryTree()).filter((c) => !c.parent).slice(0, CATEGORY_LIMIT);

  // Hero/slider config, currency, products for each category, and newest products — in parallel.
  const [home, currency, perCategory, allProducts] = await Promise.all([
    getHome(),
    getActiveCurrency(),
    Promise.all(
      categories.map(async (category) => ({
        category,
        products: (
          await listProducts({ categorySlug: category.slug, pageSize: PER_CATEGORY, sort: "newest" })
        ).items,
      })),
    ),
    listProducts({ pageSize: 8, sort: "newest" }).then((r) => r.items),
  ]);

  return (
    <div className="space-y-10">
      {home.heroSlides.length > 0 && <HomeSlider slides={home.heroSlides} locale={loc} />}
      {home.hero && <HeroSection hero={home.hero} locale={loc} />}
      {home.offerSlides.length > 0 && <HomeSlider slides={home.offerSlides} locale={loc} />}
      {/* Category quick-links */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-fg">{t("categories")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={{ pathname: "/products", query: { category: c.slug } }}
                className="group flex flex-col items-center gap-2 rounded-token p-3 text-center transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-token bg-muted ring-1 ring-border transition group-hover:ring-primary/50">
                  <ImageWithFallback image={c.image} alt={pickLocale(c.name, loc) || c.slug} fill />
                </div>
                <span className="text-sm font-medium text-fg group-hover:text-primary">
                  {pickLocale(c.name, loc) || c.slug}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* One product row per category, each linking to its full listing */}
      {perCategory
        .filter((group) => group.products.length > 0)
        .map(({ category, products }) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-fg">{pickLocale(category.name, loc) || category.slug}</h2>
              <Link
                href={{ pathname: "/products", query: { category: category.slug } }}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} locale={loc} currency={currency} />
              ))}
            </div>
          </section>
        ))}

      {/* All products at the end */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-fg">{t("allProducts")}</h2>
          <Link href="/products" className="shrink-0 text-sm font-medium text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {allProducts.map((p) => (
            <ProductCard key={p.id} product={p} locale={loc} currency={currency} />
          ))}
        </div>
      </section>
    </div>
  );
}
