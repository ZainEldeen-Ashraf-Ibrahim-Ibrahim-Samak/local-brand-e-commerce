"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/shared/cn";
import { useCompare, type CompareItem } from "@/lib/compare/useCompare";

/** Toggle a product in the browser-local compare list (max 3, FR-015/FR-016). */
export function CompareButton({ item, className }: { item: CompareItem; className?: string }) {
  const t = useTranslations("compare");
  const { has, add, remove } = useCompare();
  const [warn, setWarn] = useState(false);
  const active = has(item.productSlug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      remove(item.productSlug);
      return;
    }
    const ok = add(item);
    if (!ok) {
      setWarn(true);
      setTimeout(() => setWarn(false), 3000);
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={active}
        aria-label={active ? t("remove") : t("add")}
        title={active ? t("remove") : t("add")}
        onClick={onClick}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg/80 backdrop-blur transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          active ? "text-primary" : "text-muted-fg",
          className,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
      </button>
      {warn && (
        <span className="absolute end-0 top-10 z-10 w-48 rounded-token border border-border bg-bg p-2 text-xs text-danger shadow-md">
          {t("full")}
        </span>
      )}
    </span>
  );
}
