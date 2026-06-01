import { SupportInquiry, type SupportInquiryDoc } from "@/models/SupportInquiry";
import { connectDB } from "@/lib/db/connect";
import { rateLimit } from "@/lib/cache";
import { sendAdminEmail } from "@/lib/notifications/email";
import { Types, type FilterQuery } from "mongoose";

/**
 * Support Inquiry Service (Phase 4 User Story 2: T019).
 * Coordinates guest inquiry submission (with rate limits and non-enumeration)
 * and admin workflow processing.
 */

export async function submitInquiry(data: {
  name: string;
  email: string;
  whatsapp?: string;
  orderNumber?: string;
  subject?: string;
  message: string;
  ip: string;
}) {
  await connectDB();
  const normalizedEmail = data.email.toLowerCase().trim();

  // Rate Limiting (IP + email keys, 5 requests per 60 seconds)
  const ipKey = `rate:support:ip:${data.ip}`;
  const emailKey = `rate:support:email:${normalizedEmail}`;

  const [ipAllowed, emailAllowed] = await Promise.all([
    rateLimit(ipKey, 5, 60),
    rateLimit(emailKey, 5, 60),
  ]);

  if (!ipAllowed || !emailAllowed) {
    throw new Error("Rate limit exceeded");
  }

  // Create SupportInquiry
  await SupportInquiry.create({
    name: data.name,
    email: normalizedEmail,
    whatsapp: data.whatsapp,
    orderNumber: data.orderNumber,
    subject: data.subject,
    message: data.message,
    status: "new",
    statusHistory: [{ status: "new", changedAt: new Date() }],
    sourceIp: data.ip,
  });

  // Dispatch non-blocking admin alert email
  const alertSubject = `[Support] New Inquiry from ${data.name}: ${data.subject || "No Subject"}`;
  const alertText = `You have received a new support inquiry.

Name: ${data.name}
Email: ${normalizedEmail}
WhatsApp: ${data.whatsapp || "None"}
Order Number: ${data.orderNumber || "None"}
Subject: ${data.subject || "None"}

Message:
${data.message}

Manage inquiries at the admin dashboard: /admin/support`;

  // Run in background without awaiting to remain non-blocking for client (FR-112)
  sendAdminEmail(alertSubject, alertText).catch((err) => {
    console.error("Failed to send support admin alert email:", err);
  });

  return { success: true };
}

export async function updateInquiryStatus(
  id: string,
  status: "new" | "in_progress" | "resolved",
  userId: string,
  note?: string
) {
  await connectDB();
  const inquiry = await SupportInquiry.findById(id);
  if (!inquiry) {
    throw new Error("Inquiry not found");
  }

  // Only update if status is actually changing, or if note is provided
  if (inquiry.status !== status || note) {
    inquiry.status = status;
    inquiry.handledByUserId = new Types.ObjectId(userId) as unknown as undefined;
    inquiry.statusHistory.push({
      status,
      changedAt: new Date(),
      changedByUserId: new Types.ObjectId(userId) as unknown as undefined,
      note,
    });
    await inquiry.save();
  }

  return inquiry;
}

export async function listInquiries(filter: { status?: string } = {}) {
  await connectDB();
  const query: FilterQuery<SupportInquiryDoc> = {};
  if (filter.status) {
    query.status = filter.status;
  }
  return SupportInquiry.find(query).sort({ createdAt: -1 });
}
