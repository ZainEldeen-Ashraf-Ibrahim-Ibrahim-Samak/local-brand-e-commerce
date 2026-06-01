import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { listAdminOffers, createOffer, reorderOffers } from "@/services/admin/offers.admin.service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: localizedTextSchema,
  subtitle: localizedTextSchema.optional(),
  image: mediaRefSchema.nullable().optional(),
  ctaLabel: localizedTextSchema.optional(),
  ctaHref: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

const reorderSchema = z.object({ orderedIds: z.array(z.string()) });

/** GET /api/admin/offers — list all slider slides (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await listAdminOffers());
  });
}

/** POST /api/admin/offers — create a slide (FR-024). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = createSchema.parse(await req.json());
    return NextResponse.json(await createOffer(body), { status: 201 });
  });
}

/** PATCH /api/admin/offers — reorder slides (body: { orderedIds }). */
export async function PATCH(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = reorderSchema.parse(await req.json());
    await reorderOffers(body.orderedIds);
    return NextResponse.json({ ok: true });
  });
}
