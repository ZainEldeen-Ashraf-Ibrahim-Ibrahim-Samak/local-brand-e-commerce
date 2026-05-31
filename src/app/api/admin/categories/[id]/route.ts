import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { updateCategory, deleteCategory } from "@/services/admin/catalog.admin.service";

const patchSchema = z.object({
  name: localizedTextSchema.optional(),
  slug: z.string().optional(),
  parent: z.string().nullable().optional(),
  image: mediaRefSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** PATCH /api/admin/categories/:id — edit a category. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const category = await updateCategory(id, body);
    return NextResponse.json(category);
  });
}

/** DELETE /api/admin/categories/:id — remove a category (blocked if in use). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await deleteCategory(id);
    return new NextResponse(null, { status: 204 });
  });
}
