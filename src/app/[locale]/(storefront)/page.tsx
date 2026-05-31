import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { listProducts } from "@/services/catalog.service";
import { Button } from "@/components/ui";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Storefront home — featured/newest products (FR-001). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("nav");
  const { items } = await listProducts({ pageSize: 8, sort: "newest" });

  return (
    <div className="space-y-8">
      <section className="rounded-token bg-muted p-8 text-center">
        <h1 className="text-2xl font-bold text-fg">{t("products")}</h1>
        <Link href="/products">
          <Button className="mt-4">{t("products")}</Button>
        </Link>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale as AppLocale} />
          ))}
        </div>
      </section>
    </div>
  );
}
