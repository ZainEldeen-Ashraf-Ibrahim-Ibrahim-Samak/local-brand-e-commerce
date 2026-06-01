import { listAdminCategories } from "@/services/admin/catalog.admin.service";
import { CategoryManager, type ManagedCategory } from "@/components/admin/catalog/CategoryManager";
import type { LocalizedText } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin category management (FR-018). */
export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  const managed: ManagedCategory[] = categories.map((c) => {
    const name = c.name as LocalizedText;
    return {
      id: c.id,
      nameEn: name.en,
      nameAr: name.ar,
      slug: c.slug,
      isActive: c.isActive,
      image: c.image ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Categories</h1>
      <CategoryManager categories={managed} />
    </div>
  );
}
