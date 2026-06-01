import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { updateProduct, deleteProduct } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: localizedTextSchema.optional(),
  slug: z.string().optional(),
  description: localizedTextSchema.optional(),
  category: z.string().min(1).optional(),
  basePrice: z.number().int().min(0).optional(),
  images: z.array(mediaRefSchema).optional(),
  attributes: z
    .array(z.object({ key: z.string(), label: localizedTextSchema, values: z.array(z.string()) }))
    .optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
  seo: z.object({ title: localizedTextSchema.optional(), keywords: z.array(z.string()).optional() }).optional(),
});

/** PATCH /api/admin/products/:id — edit product / change publish status (FR-018). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const product = await updateProduct(id, body);
    return NextResponse.json(product);
  });
}

/** DELETE /api/admin/products/:id — remove product + its variations. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await deleteProduct(id);
    return new NextResponse(null, { status: 204 });
  });
}
