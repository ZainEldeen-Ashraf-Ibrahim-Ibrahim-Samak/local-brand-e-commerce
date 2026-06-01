import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { createCategory, listAdminCategories } from "@/services/admin/catalog.admin.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: localizedTextSchema,
  slug: z.string().optional(),
  parent: z.string().nullable().optional(),
  image: mediaRefSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** GET /api/admin/categories — list all categories (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await listAdminCategories());
  });
}

/** POST /api/admin/categories — create a category (FR-018). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    const category = await createCategory(body);
    return NextResponse.json(category, { status: 201 });
  });
}
