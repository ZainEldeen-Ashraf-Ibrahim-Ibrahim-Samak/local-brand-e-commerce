import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, AppError } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateUser } from "@/services/admin/accounts.admin.service";

const patchAccountSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["admin", "buyer"]).optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
});

/** PATCH /api/admin/accounts/[id] — Update staff account role or (de)activate status (admin-only) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const body = patchAccountSchema.parse(await req.json());

    try {
      const user = await updateUser(id, body);
      return NextResponse.json(user);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("Cannot deactivate") ||
          err.message.includes("Cannot demote") ||
          err.message.includes("User not found")
        ) {
          throw new AppError("VALIDATION", err.message, 422);
        }
      }
      throw err;
    }
  });
}
