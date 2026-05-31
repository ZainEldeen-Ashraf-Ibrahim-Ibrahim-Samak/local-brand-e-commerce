import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { signUpload } from "@/lib/media/cloudinary";

const schema = z.object({ folder: z.string().optional() });

/** POST /api/admin/media/sign — signed Cloudinary upload params (secret stays server-side). */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireRole("admin");
    const body = schema.parse(await req.json().catch(() => ({})));
    return NextResponse.json(signUpload(body.folder));
  });
}
