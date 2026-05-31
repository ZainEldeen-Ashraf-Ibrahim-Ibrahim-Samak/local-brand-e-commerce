import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/http/errors";
import { getWebsiteSettings, getThemeSettings } from "@/services/settings.service";

/** Public settings used to render header/footer/SEO + theme defaults (FR-026/FR-027). */
export async function GET() {
  return handleRoute(async () => {
    const [website, theme] = await Promise.all([getWebsiteSettings(), getThemeSettings()]);
    return NextResponse.json({ website, theme });
  });
}
