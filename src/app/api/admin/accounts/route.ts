import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/http/errors";
import { requireRole } from "@/lib/auth/guards";
import { createUser, listUsers } from "@/services/admin/accounts.admin.service";

export const dynamic = "force-dynamic";

const createAccountSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum(["admin", "buyer"]),
    method: z.enum(["temp-password", "invite"]),
    password: z.string().min(6).optional(),
    locale: z.string().optional(),
  })
  .refine((data) => data.method !== "temp-password" || !!data.password, {
    message: "Password is required for temporary password method",
    path: ["password"],
  });

/** GET /api/admin/accounts — List all staff accounts (admin-only) */
export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    const users = await listUsers();
    return NextResponse.json(users);
  });
}

/** POST /api/admin/accounts — Provision a new staff account (admin-only) */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const adminUser = await requireRole("admin");
    const body = createAccountSchema.parse(await req.json());
    
    const result = await createUser({
      email: body.email,
      name: body.name,
      role: body.role,
      password: body.password,
      method: body.method,
      createdByUserId: adminUser.id,
      locale: body.locale,
    });
    
    return NextResponse.json(
      {
        user: result.user,
        inviteToken: result.inviteToken,
      },
      { status: 201 }
    );
  });
}
