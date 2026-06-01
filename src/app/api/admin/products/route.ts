import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { createProduct, listAdminProducts, type ProductStatus } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: localizedTextSchema,
  slug: z.string().optional(),
  description: localizedTextSchema.optional(),
  category: z.string().min(1),
  basePrice: z.number().int().min(0),
  images: z.array(mediaRefSchema).optional(),
  attributes: z
    .array(z.object({ key: z.string(), label: localizedTextSchema, values: z.array(z.string()) }))
    .optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
  seo: z.object({ title: localizedTextSchema.optional(), keywords: z.array(z.string()).optional() }).optional(),
});

/** GET /api/admin/products — list/filter all products (admin, any status). */
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const sp = req.nextUrl.searchParams;
    const result = await listAdminProducts({
      status: (sp.get("status") as ProductStatus) ?? undefined,
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}

/** POST /api/admin/products — create a product (FR-018). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireRole("admin");
    const body = createSchema.parse(await req.json());
    const product = await createProduct(body, user.id);
    return NextResponse.json(product, { status: 201 });
  });
}
