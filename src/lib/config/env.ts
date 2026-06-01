import { z } from "zod";

/**
 * Centralized, validated environment access (Constitution Principle III:
 * secrets only via env, never hard-coded). Import `env` instead of reading
 * `process.env` directly so missing/invalid config fails fast at boot.
 */
const schema = z.object({
  MONGODB_URI: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  AUTH_SECRET: z.string().min(16),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SUPPORT_ALERT_EMAIL: z.string().optional(),

  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["stripe"]).default("stripe"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["ar", "en"]).default("ar"),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  ORDER_EXPIRY_MINUTES: z.coerce.number().default(30),
  CRON_SECRET: z.string().optional(),
});

let cached: z.infer<typeof schema> | null = null;

export function getEnv(): z.infer<typeof schema> {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export type AppLocale = "ar" | "en";
export const LOCALES: AppLocale[] = ["ar", "en"];
