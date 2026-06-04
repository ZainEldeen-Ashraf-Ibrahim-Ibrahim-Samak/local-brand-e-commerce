"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CountBadge } from "@/components/ui/CountBadge";
import { useCart } from "@/lib/cart/useCart";
import { useFavorites } from "@/lib/favorites/useFavorites";
import { useCompare } from "@/lib/compare/useCompare";

/** Cart / favorites / compare quick-links with live count badges (FR-017). */
export function HeaderActions() {
  const t = useTranslations("nav");
  const tf = useTranslations("favorites");
  const tc = useTranslations("compare");
  const cart = useCart();
  const favorites = useFavorites();
  const compare = useCompare();

  return (
    <div className="flex items-center gap-3">
      <Action href="/favorites" label={tf("title")} count={favorites.count}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </Action>
      <Action href="/compare" label={tc("title")} count={compare.count}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
      </Action>
      <Action href="/cart" label={t("cart")} count={cart.count}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      </Action>
    </div>
  );
}

function Action({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}${count ? ` (${count})` : ""}`}
      className="relative inline-flex items-center text-fg hover:text-primary"
    >
      {children}
      <CountBadge count={count} className="absolute -end-2 -top-2" />
    </Link>
  );
}
