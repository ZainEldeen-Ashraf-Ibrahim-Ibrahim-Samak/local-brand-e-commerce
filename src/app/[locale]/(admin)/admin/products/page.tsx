import { Link } from "@/i18n/navigation";
import { listAdminProducts, listAdminCategories } from "@/services/admin/catalog.admin.service";
import { Card, CardBody, Badge, Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { pickLocale } from "@/lib/shared/types";
import { mediaUrl } from "@/lib/media/cloudinary-url";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Admin product list (FR-018). Links to create + edit. */
export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [{ items }, categories] = await Promise.all([listAdminProducts({ pageSize: 100 }), listAdminCategories()]);
  const catName = new Map(categories.map((c) => [c.id, pickLocale(c.name, loc) || c.slug]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Products</h1>
        <Link href="/admin/products/new">
          <Button>New product</Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          {items.length === 0 ? (
            <p className="text-sm text-muted-fg">No products yet.</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-muted-fg">
                  <th className="py-2 text-start font-medium w-12"></th>
                  <th className="py-2 text-start font-medium">Name</th>
                  <th className="py-2 text-start font-medium">Category</th>
                  <th className="py-2 text-start font-medium">Price</th>
                  <th className="py-2 text-start font-medium">Variations</th>
                  <th className="py-2 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="py-2 pe-2">
                      {/* Thumbnail from first product image */}
                      <div className="h-10 w-10 overflow-hidden rounded bg-muted flex-shrink-0">
                        {p.firstImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(p.firstImage, 80)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-fg hover:text-primary">
                        {pickLocale(p.name, loc) || p.slug}
                      </Link>
                    </td>
                    <td className="py-2 text-fg">{catName.get(p.category) ?? "—"}</td>
                    <td className="py-2 text-fg">{formatMoney(p.basePrice, loc)}</td>
                    <td className="py-2 text-fg">{p.variationCount}</td>
                    <td className="py-2">
                      <Badge tone={p.status === "published" ? "success" : "muted"}>{p.status}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/admin/products/${p.id}`} className="text-sm text-primary">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
