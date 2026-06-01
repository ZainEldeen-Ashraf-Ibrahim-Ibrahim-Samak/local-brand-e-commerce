import nodemailer from "nodemailer";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/observability/logger";

/**
 * Reusable SMTP email helper (Phase 2 Foundational: T003).
 * Exposes methods to send general emails and administrative alert emails.
 */

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    logger.info("SMTP not configured; skipping email", { to, subject });
    return;
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  const from = env.SMTP_FROM ?? env.SMTP_USER;
  await transport.sendMail({
    from,
    to,
    subject,
    text,
  });
  logger.info("Email sent successfully", { to, subject });
}

export async function sendAdminEmail(subject: string, text: string): Promise<void> {
  const env = getEnv();
  const adminEmail = env.SUPPORT_ALERT_EMAIL || env.SMTP_FROM || env.SMTP_USER;
  if (!adminEmail) {
    logger.warn("No admin alert email configured; skipping admin alert email", { subject });
    return;
  }
  await sendEmail(adminEmail, subject, text);
}
