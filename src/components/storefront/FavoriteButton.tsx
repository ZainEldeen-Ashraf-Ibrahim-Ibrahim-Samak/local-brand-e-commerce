"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/shared/cn";
import { useFavorites, type FavoriteItem } from "@/lib/favorites/useFavorites";

/** Toggle a product in the browser-local favorites list (FR-013). */
export function FavoriteButton({ item, className }: { item: FavoriteItem; className?: string }) {
  const t = useTranslations("favorites");
  const { has, toggle } = useFavorites();
  const active = has(item.productSlug);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t("remove") : t("add")}
      title={active ? t("remove") : t("add")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg/80 backdrop-blur transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        active ? "text-danger" : "text-muted-fg",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
