"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardBody } from "@/components/ui";
import { useCart } from "@/lib/cart/useCart";
import { useEffect } from "react";

/** Order confirmation. The cart is cleared once the order has been placed (FR-011). */
export default function CheckoutSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  use(params);
  const t = useTranslations("checkout");
  const sp = useSearchParams();
  const orderNumber = sp.get("order");
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <Card className="mx-auto max-w-md text-center">
      <CardBody className="space-y-4 py-10">
        <h1 className="text-xl font-bold text-success">{t("orderConfirmed")}</h1>
        {orderNumber && (
          <p className="text-fg">
            {t("orderNumber")}: <span className="font-mono font-semibold">{orderNumber}</span>
          </p>
        )}
        <Link href="/track">
          <Button variant="outline">{t("orderNumber")}</Button>
        </Link>
      </CardBody>
    </Card>
  );
}
