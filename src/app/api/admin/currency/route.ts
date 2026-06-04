import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { currencySchema } from "@/lib/validation/content";
import { getWebsiteSettings } from "@/services/settings.service";
import { updateWebsiteSettings } from "@/services/admin/settings.admin.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/currency — current currency config (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    const settings = await getWebsiteSettings();
    return NextResponse.json((settings as { currency?: unknown }).currency ?? null);
  });
}

/**
 * PUT /api/admin/currency — set active currency + per-currency exchange rates.
 * Validates active∈options and base rate===1 (FR-007/FR-021); invalidates cache.
 */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const currency = currencySchema.parse(await req.json());
    return NextResponse.json(await updateWebsiteSettings({ currency }));
  });
}
