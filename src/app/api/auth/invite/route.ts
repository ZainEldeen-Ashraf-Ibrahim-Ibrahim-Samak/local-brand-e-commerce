import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, AppError } from "@/lib/http/errors";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { hashInviteToken, isInviteExpired } from "@/lib/auth/invite";
import bcrypt from "bcryptjs";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

/** POST /api/auth/invite — Accept invite, set password, and activate account (public) */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await connectDB();
    const body = acceptInviteSchema.parse(await req.json());
    
    // Hash incoming token
    const tokenHash = hashInviteToken(body.token);

    // Find user with matching invite token (must select select:false inviteTokenHash)
    const user = await User.findOne({ inviteTokenHash: tokenHash }).select("+inviteTokenHash");

    if (!user || !user.inviteExpiresAt || isInviteExpired(user.inviteExpiresAt)) {
      throw new AppError("VALIDATION", "Invalid or expired invitation token", 422);
    }

    // Set new password
    const passwordHash = await bcrypt.hash(body.password, 10);
    user.passwordHash = passwordHash;
    
    // Clear invite fields and set status
    user.inviteTokenHash = undefined;
    user.inviteExpiresAt = undefined;
    user.invitedAt = undefined;
    user.status = "active";
    user.isActive = true;

    await user.save();

    return NextResponse.json({ success: true });
  });
}
