import { connectDB } from "@/lib/db/connect";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/observability/logger";
import { NotificationLog } from "@/models/NotificationLog";
import { sendEmail } from "@/lib/notifications/email";

/**
 * Order notification dispatcher (spec FR-014/FR-015). Sends via email (SMTP) and
 * WhatsApp with bounded retries + backoff. Channel failures are logged but never
 * block order status progression (the caller does not await hard failures).
 */
export type NotifyInput = {
  orderId: string;
  event: string; // e.g. "status:shipped"
  email: string;
  whatsapp: string;
  subject: string;
  message: string;
};

const MAX_ATTEMPTS = 3;

function backoff(attempt: number) {
  return new Promise((r) => setTimeout(r, Math.min(2000, 100 * 2 ** attempt)));
}

async function withRetry(channel: "email" | "whatsapp", orderId: string, event: string, send: () => Promise<void>) {
  await connectDB();
  const log = await NotificationLog.create({ orderId, channel, event, status: "queued", attempts: 0 });
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await send();
      log.status = "sent";
      log.attempts = attempt + 1;
      await log.save();
      return;
    } catch (err) {
      log.attempts = attempt + 1;
      log.lastError = err instanceof Error ? err.message : String(err);
      log.status = "failed";
      await log.save();
      logger.warn("Notification send failed", { channel, orderId, event, attempt: attempt + 1 });
      if (attempt < MAX_ATTEMPTS - 1) await backoff(attempt);
    }
  }
}

async function sendWhatsApp(to: string, message: string) {
  const env = getEnv();
  if (!env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_ID) {
    logger.info("WhatsApp not configured; skipping message", { to });
    return;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}`);
}

/** Fire both channels. Returns immediately-resolved; failures are logged, not thrown. */
export async function dispatchOrderNotification(input: NotifyInput): Promise<void> {
  await Promise.allSettled([
    withRetry("email", input.orderId, input.event, () => sendEmail(input.email, input.subject, input.message)),
    withRetry("whatsapp", input.orderId, input.event, () => sendWhatsApp(input.whatsapp, input.message)),
  ]);
}
