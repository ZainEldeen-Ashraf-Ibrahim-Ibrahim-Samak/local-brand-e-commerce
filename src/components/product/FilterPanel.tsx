"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Button, Select } from "@/components/ui";

/** Catalog filter controls (size/color/price/sort). Updates the URL query (FR-003). */
export function FilterPanel({ sizes, colors }: { sizes: string[]; colors: string[] }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-muted-fg">{t("size")}</span>
        <Select value={sp.get("size") ?? ""} onChange={(e) => update("size", e.target.value)} className="w-32">
          <option value="">—</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-fg">{t("color")}</span>
        <Select value={sp.get("color") ?? ""} onChange={(e) => update("color", e.target.value)} className="w-32">
          <option value="">—</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-fg">{t("price")}</span>
        <Select value={sp.get("sort") ?? ""} onChange={(e) => update("sort", e.target.value)} className="w-40">
          <option value="">—</option>
          <option value="price-asc">↑</option>
          <option value="price-desc">↓</option>
        </Select>
      </label>
      <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
        {t("clear")}
      </Button>
    </div>
  );
}
