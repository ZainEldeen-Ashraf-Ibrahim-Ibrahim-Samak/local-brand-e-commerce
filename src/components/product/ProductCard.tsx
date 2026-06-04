import { Link } from "@/i18n/navigation";
import { Card, CardBody, ImageWithFallback } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney, type DisplayCurrency } from "@/lib/format";
import { FavoriteButton } from "@/components/storefront/FavoriteButton";
import { CompareButton } from "@/components/storefront/CompareButton";
import type { ProductCardDTO } from "@/services/catalog.service";
import type { AppLocale } from "@/lib/config/env";

/** Reusable product card (Principle I). Used in catalog, home, and featured grids. */
export function ProductCard({
  product,
  locale,
  currency,
}: {
  product: ProductCardDTO;
  locale: AppLocale;
  currency?: DisplayCurrency;
}) {
  const name = pickLocale(product.name, locale);
  const item = {
    productSlug: product.slug,
    name: product.name,
    basePrice: product.basePrice,
    image: product.image,
  };
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden transition group-hover:shadow-md">
        <div className="relative aspect-square bg-muted overflow-hidden">
          <ImageWithFallback
            image={product.image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute end-2 top-2 flex flex-col gap-2">
            <FavoriteButton item={item} />
            <CompareButton item={item} />
          </div>
        </div>
        <CardBody>
          <h3 className="line-clamp-2 text-sm font-medium text-fg">{name}</h3>
          {product.salePrice != null && product.salePrice < product.basePrice ? (
            <p className="mt-1 flex items-center gap-2 text-sm">
              <span className="font-semibold text-danger">{formatMoney(product.salePrice, locale, currency ?? "USD")}</span>
              <span className="text-xs text-muted-fg line-through">
                {formatMoney(product.basePrice, locale, currency ?? "USD")}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatMoney(product.basePrice, locale, currency ?? "USD")}
            </p>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}
