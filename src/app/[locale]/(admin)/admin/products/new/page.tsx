import { listAdminCategories } from "@/services/admin/catalog.admin.service";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { pickLocale } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Create-product page (FR-018). */
export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const categories = await listAdminCategories();
  const formCategories = categories.map((c) => ({ id: c.id, name: pickLocale(c.name, loc) || c.slug }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">New product</h1>
      <ProductForm categories={formCategories} />
    </div>
  );
}
