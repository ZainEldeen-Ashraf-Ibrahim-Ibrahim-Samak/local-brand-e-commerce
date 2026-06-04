import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { contentSchema } from "@/lib/validation/content";
import { getWebsiteSettings } from "@/services/settings.service";
import { updateWebsiteSettings } from "@/services/admin/settings.admin.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/content — current content settings (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await getWebsiteSettings());
  });
}

/**
 * PUT /api/admin/content — update header/footer/nav/home sections + About/Contact/
 * Privacy/Terms pages; invalidates the public cache (FR-001–FR-004, FR-009).
 */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = contentSchema.parse(await req.json());
    return NextResponse.json(await updateWebsiteSettings(body));
  });
}
