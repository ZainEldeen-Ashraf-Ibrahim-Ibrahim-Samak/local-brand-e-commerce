import { notFound } from "next/navigation";
import { getAdminProduct, listAdminCategories } from "@/services/admin/catalog.admin.service";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { VariationsEditor, type EditorVariation } from "@/components/admin/catalog/VariationsEditor";
import { pickLocale, type LocalizedText, type MediaRef } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Edit-product page: details form + variations manager (FR-018/FR-019). */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale as AppLocale;
  const [data, categories] = await Promise.all([getAdminProduct(id), listAdminCategories()]);
  if (!data) notFound();

  const { product, variations } = data;
  const name = product.name as LocalizedText;
  const description = (product.description ?? { en: "", ar: "" }) as LocalizedText;

  const formCategories = categories.map((c) => ({ id: c.id, name: pickLocale(c.name, loc) || c.slug }));
  // Map images from lean() result — cloudinaryId/version are always strings when present
  const productImages: MediaRef[] = (product.images ?? []).flatMap((img) => {
    const i = img as { cloudinaryId?: string | null; version?: string | null; alt?: { en?: string | null; ar?: string | null } | null };
    if (!i.cloudinaryId || !i.version) return [];
    return [{
      cloudinaryId: i.cloudinaryId,
      version: i.version,
      ...(i.alt ? { alt: { en: i.alt.en ?? "", ar: i.alt.ar ?? "" } } : {}),
    }];
  });

  const editorVariations: EditorVariation[] = variations.map((v) => {
    const options = (v.options ?? {}) as Record<string, string>;
    const vi = v.image as { cloudinaryId?: string | null; version?: string | null } | null | undefined;
    return {
      id: String(v._id),
      sku: v.sku,
      size: options.size ?? "",
      color: options.color ?? "",
      priceMajor: v.priceOverride != null ? String(v.priceOverride / 100) : "",
      stock: v.stock,
      isActive: v.isActive,
      image: vi?.cloudinaryId && vi?.version
        ? { cloudinaryId: vi.cloudinaryId, version: vi.version }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">{pickLocale(name, loc) || product.slug}</h1>
      <ProductForm
        categories={formCategories}
        initial={{
          id: String(product._id),
          nameEn: name.en,
          nameAr: name.ar,
          descriptionEn: description.en,
          descriptionAr: description.ar,
          category: String(product.category),
          basePriceMajor: product.basePrice / 100,
          status: product.status as "draft" | "published" | "unpublished",
          images: productImages,
        }}
      />
      <VariationsEditor productId={String(product._id)} variations={editorVariations} />
    </div>
  );
}
