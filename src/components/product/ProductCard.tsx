import { Link } from "@/i18n/navigation";
import { Card, CardBody, ImageWithFallback } from "@/components/ui";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney } from "@/lib/format";
import type { ProductCardDTO } from "@/services/catalog.service";
import type { AppLocale } from "@/lib/config/env";

/** Reusable product card (Principle I). Used in catalog, home, and featured grids. */
export function ProductCard({ product, locale }: { product: ProductCardDTO; locale: AppLocale }) {
  const name = pickLocale(product.name, locale);
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
        </div>
        <CardBody>
          <h3 className="line-clamp-2 text-sm font-medium text-fg">{name}</h3>
          <p className="mt-1 text-sm font-semibold text-primary">{formatMoney(product.basePrice, locale)}</p>
        </CardBody>
      </Card>
    </Link>
  );
}
