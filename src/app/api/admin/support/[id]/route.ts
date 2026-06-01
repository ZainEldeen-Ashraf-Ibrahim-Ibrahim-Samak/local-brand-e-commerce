import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, AppError } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateInquiryStatus } from "@/services/support.service";

const patchSupportSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved"]),
  note: z.string().optional(),
});

/** PATCH /api/admin/support/[id] — Update support inquiry status and log notes (admin-only) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const adminUser = await requireRole("admin");
    const { id } = await params;
    const body = patchSupportSchema.parse(await req.json());

    try {
      const inquiry = await updateInquiryStatus(id, body.status, adminUser.id, body.note);
      return NextResponse.json(inquiry);
    } catch (err) {
      if (err instanceof Error && err.message === "Inquiry not found") {
        throw new AppError("VALIDATION", err.message, 422);
      }
      throw err;
    }
  });
}
