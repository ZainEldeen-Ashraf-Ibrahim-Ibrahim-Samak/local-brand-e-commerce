import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { getThemeSettings } from "@/services/settings.service";
import { updateThemeSettings } from "@/services/admin/settings.admin.service";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamily: z.string(),
    baseFontSizePx: z.number().int().min(10).max(24),
    layout: z.enum(["classic", "compact", "wide"]),
    defaultMode: z.enum(["light", "dark"]),
    defaultLanguage: z.enum(["ar", "en"]),
    palette: z.object({ light: z.record(z.string(), z.string()), dark: z.record(z.string(), z.string()) }).partial(),
  })
  .partial();

/** GET /api/admin/theme — current theme (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await getThemeSettings());
  });
}

/** PUT /api/admin/theme — update theme + invalidate cache; reflected within 1 min (FR-027/SC-007). */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    return NextResponse.json(await updateThemeSettings(body));
  });
}
