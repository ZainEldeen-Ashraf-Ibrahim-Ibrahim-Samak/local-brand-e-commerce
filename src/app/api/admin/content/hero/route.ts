import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { heroSchema } from "@/lib/validation/content";
import { updateWebsiteSettings } from "@/services/admin/settings.admin.service";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/content/hero — save the home hero config (full-bleed background +
 * toggleable overlay components). Background is uploaded via the existing signed
 * Cloudinary endpoint (FR-005/FR-010).
 */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const hero = heroSchema.parse(await req.json());
    return NextResponse.json(await updateWebsiteSettings({ hero }));
  });
}
