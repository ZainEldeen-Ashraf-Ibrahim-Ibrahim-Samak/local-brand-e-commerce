import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, Errors } from "@/lib/http/errors";
import { requireUser } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { updateOwnProduct } from "@/services/buyer.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: localizedTextSchema.optional(),
  slug: z.string().optional(),
  description: localizedTextSchema.optional(),
  category: z.string().min(1).optional(),
  basePrice: z.number().int().min(0).optional(),
  images: z.array(mediaRefSchema).optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
});

async function requireBuyer() {
  const user = await requireUser();
  if (user.role !== "buyer") throw Errors.forbidden();
  return user;
}

/** PATCH /api/buyer/products/:id — edit an owned product; 403 if owned by another (FR-029). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireBuyer();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    return NextResponse.json(await updateOwnProduct(id, body, user.id));
  });
}
