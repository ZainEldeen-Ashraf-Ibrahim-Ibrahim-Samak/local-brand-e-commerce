import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, Errors } from "@/lib/http/errors";
import { requireUser } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { listOwnProducts, createOwnProduct } from "@/services/buyer.service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: localizedTextSchema,
  slug: z.string().optional(),
  description: localizedTextSchema.optional(),
  category: z.string().min(1),
  basePrice: z.number().int().min(0),
  images: z.array(mediaRefSchema).optional(),
  status: z.enum(["draft", "published", "unpublished"]).optional(),
});

/** Require an authenticated buyer (admins use the admin endpoints). */
async function requireBuyer() {
  const user = await requireUser();
  if (user.role !== "buyer") throw Errors.forbidden();
  return user;
}

/** GET /api/buyer/products — list only the caller's own products (FR-029). */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireBuyer();
    return NextResponse.json(await listOwnProducts(user.id));
  });
}

/** POST /api/buyer/products — create a product owned by the caller. */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireBuyer();
    const body = createSchema.parse(await req.json());
    return NextResponse.json(await createOwnProduct(body, user.id), { status: 201 });
  });
}
