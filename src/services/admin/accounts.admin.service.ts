import { User } from "@/models/User";
import { connectDB } from "@/lib/db/connect";
import { generateInviteToken } from "@/lib/auth/invite";
import { sendEmail } from "@/lib/notifications/email";
import { getEnv } from "@/lib/config/env";
import bcrypt from "bcryptjs";

/**
 * Staff Accounts Administration Service (Phase 3 User Story 1: T008).
 * Provides creation (temp-password or invite email), modification, (de)activation,
 * and deactivation protection for the last active administrator.
 */

export async function createUser(data: {
  email: string;
  name: string;
  role: "admin" | "buyer";
  password?: string;
  method: "temp-password" | "invite";
  createdByUserId?: string;
  locale?: string;
}) {
  await connectDB();
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check email uniqueness (FR-103)
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  if (data.method === "temp-password") {
    if (!data.password) {
      throw new Error("Temporary password is required");
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: normalizedEmail,
      name: data.name,
      role: data.role,
      passwordHash,
      isActive: true,
      status: "active",
      createdByUserId: data.createdByUserId,
    });
    return { user };
  } else {
    // invite method
    const { token, hash } = generateInviteToken();
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours expiry
    const user = await User.create({
      email: normalizedEmail,
      name: data.name,
      role: data.role,
      status: "pending",
      isActive: true,
      inviteTokenHash: hash,
      inviteExpiresAt,
      invitedAt: new Date(),
      createdByUserId: data.createdByUserId,
    });

    // Send email
    const env = getEnv();
    const locale = data.locale || "en";
    const inviteUrl = `${env.NEXT_PUBLIC_BASE_URL}/${locale}/accept-invite?token=${token}`;

    const subject = locale === "ar" ? "دعوة للانضمام إلى لوحة التحكم" : "Invitation to join the dashboard";
    const text = locale === "ar"
      ? `مرحباً ${data.name}،\n\nلقد تم دعوتك للانضمام إلى لوحة التحكم كـ ${data.role === "admin" ? "مدير" : "مشتري"}.\nيرجى استخدام الرابط التالي لتعيين كلمة المرور الخاصة بك وتفعيل حسابك:\n${inviteUrl}\n\nهذا الرابط صالح لمدة 48 ساعة.`
      : `Hello ${data.name},\n\nYou have been invited to join the dashboard as an ${data.role}.\nPlease use the following link to set your password and activate your account:\n${inviteUrl}\n\nThis link is valid for 48 hours.`;

    try {
      await sendEmail(normalizedEmail, subject, text);
    } catch (err) {
      console.error("Failed to send invite email:", err);
    }

    return { user, inviteToken: token };
  }
}

export async function updateUser(
  id: string,
  updates: {
    name?: string;
    role?: "admin" | "buyer";
    isActive?: boolean;
    status?: "active" | "inactive" | "pending";
  }
) {
  await connectDB();
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  const isCurrentlyActiveAdmin = user.role === "admin" && user.isActive && user.status === "active";

  if (isCurrentlyActiveAdmin) {
    const willBeDeactivated =
      updates.isActive === false || updates.status === "inactive" || updates.status === "pending";
    const willBeDemoted = updates.role === "buyer";

    if (willBeDeactivated || willBeDemoted) {
      const otherActiveAdminsCount = await User.countDocuments({
        _id: { $ne: user._id },
        role: "admin",
        isActive: true,
        status: "active",
      });

      if (otherActiveAdminsCount === 0) {
        if (willBeDeactivated) {
          throw new Error("Cannot deactivate the last active administrator");
        }
        if (willBeDemoted) {
          throw new Error("Cannot demote the last active administrator");
        }
      }
    }
  }

  // Apply updates
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.role !== undefined) user.role = updates.role;
  
  if (updates.isActive !== undefined) {
    user.isActive = updates.isActive;
    if (!updates.isActive) {
      user.status = "inactive";
    } else if (user.status === "inactive") {
      user.status = "active";
    }
  }

  if (updates.status !== undefined) {
    user.status = updates.status;
    if (updates.status === "inactive") {
      user.isActive = false;
    } else if (updates.status === "active") {
      user.isActive = true;
    }
  }

  await user.save();
  return user;
}

export async function listUsers() {
  await connectDB();
  return User.find({}).sort({ createdAt: -1 });
}
