"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardBody, Input } from "@/components/ui";
import { useCart } from "@/lib/cart/useCart";
import { pickLocale } from "@/lib/shared/types";
import { formatMoney } from "@/lib/format";
import type { AppLocale } from "@/lib/config/env";

/** Guest cart: review, adjust quantities, proceed to checkout (FR-006). */
export default function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations("common");
  const { items, setQuantity, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-fg">{t("cart")}</p>
        <Link href="/products">
          <Button className="mt-4">{t("continue")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-fg">{t("cart")}</h1>
      {items.map((item) => (
        <Card key={item.variationId}>
          <CardBody className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-fg">{pickLocale(item.name, locale as AppLocale)}</p>
              <p className="text-sm text-muted-fg">{Object.values(item.options).join(" / ")}</p>
              <p className="text-sm text-primary">{formatMoney(item.unitPrice, locale as AppLocale)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => setQuantity(item.variationId, Math.max(1, Number(e.target.value)))}
                className="w-20"
              />
              <Button variant="ghost" size="sm" onClick={() => remove(item.variationId)}>
                ✕
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-muted-fg">{t("subtotal")}</span>
        <span className="text-lg font-semibold text-fg">{formatMoney(subtotal, locale as AppLocale)}</span>
      </div>
      <Link href="/checkout" className="block">
        <Button size="lg" className="w-full">
          {t("checkout")}
        </Button>
      </Link>
    </div>
  );
}
