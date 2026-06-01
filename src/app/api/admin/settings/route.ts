import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";
import { getWebsiteSettings } from "@/services/settings.service";
import { updateWebsiteSettings } from "@/services/admin/settings.admin.service";

export const dynamic = "force-dynamic";

const linkSchema = z.object({ label: localizedTextSchema, href: z.string() });

const schema = z
  .object({
    storeName: localizedTextSchema,
    logo: mediaRefSchema,
    header: z.object({ announcement: localizedTextSchema, navLinks: z.array(linkSchema) }),
    footer: z.object({
      aboutShort: localizedTextSchema,
      columns: z.array(z.object({ title: localizedTextSchema, links: z.array(linkSchema) })),
    }),
    contactPage: z.object({
      body: localizedTextSchema,
      email: z.string(),
      phone: z.string(),
      whatsapp: z.string(),
      address: z.string(),
    }),
    aboutPage: z.object({ body: localizedTextSchema }),
    socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })),
    seo: z.object({ description: localizedTextSchema, keywords: z.array(z.string()) }),
  })
  .partial();

/** GET /api/admin/settings — current website settings (admin). */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    return NextResponse.json(await getWebsiteSettings());
  });
}

/** PUT /api/admin/settings — update website settings + invalidate public cache (FR-026). */
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json());
    return NextResponse.json(await updateWebsiteSettings(body));
  });
}
