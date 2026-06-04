"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";

/** Catalog filter controls (category/sub-category/size/color/price). Updates the URL query (FR-011). */
export function FilterPanel({
  sizes,
  colors,
  categories = [],
  subCategories = [],
}: {
  sizes: string[];
  colors: string[];
  categories?: { slug: string; label: string }[];
  subCategories?: { slug: string; label: string }[];
}) {
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
      {categories.length > 0 && (
        <label className="text-sm">
          <span className="mb-1 block text-muted-fg">{t("category")}</span>
          <Select
            value={sp.get("category") ?? ""}
            onChange={(e) => update("category", e.target.value)}
            className="w-40"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
      )}
      {subCategories.length > 0 && (
        <label className="text-sm">
          <span className="mb-1 block text-muted-fg">{t("subCategory")}</span>
          <Select
            value={sp.get("category") ?? ""}
            onChange={(e) => update("category", e.target.value)}
            className="w-40"
          >
            <option value="">—</option>
            {subCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
      )}
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
        <span className="mb-1 block text-muted-fg">{t("minPrice")}</span>
        <Input
          type="number"
          min={0}
          defaultValue={sp.get("minPrice") ?? ""}
          onBlur={(e) => update("minPrice", e.target.value)}
          className="w-28"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted-fg">{t("maxPrice")}</span>
        <Input
          type="number"
          min={0}
          defaultValue={sp.get("maxPrice") ?? ""}
          onBlur={(e) => update("maxPrice", e.target.value)}
          className="w-28"
        />
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
