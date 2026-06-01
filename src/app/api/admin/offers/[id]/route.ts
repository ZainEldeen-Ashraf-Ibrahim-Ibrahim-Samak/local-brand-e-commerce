import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { updateOffer, deleteOffer } from "@/services/admin/offers.admin.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: localizedTextSchema.optional(),
  subtitle: localizedTextSchema.optional(),
  image: mediaRefSchema.optional(),
  ctaLabel: localizedTextSchema.optional(),
  ctaHref: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

/** PATCH /api/admin/offers/:id — edit a slide. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    return NextResponse.json(await updateOffer(id, body));
  });
}

/** DELETE /api/admin/offers/:id — remove a slide. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await deleteOffer(id);
    return new NextResponse(null, { status: 204 });
  });
}
