import { connectDB } from "@/lib/db/connect";
import { WebsiteSettings, type WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import { ThemeSettings, type ThemeSettingsDoc } from "@/models/ThemeSettings";
import { invalidateSettings, invalidateTheme } from "@/services/settings.service";

/**
 * Admin singleton writers (spec FR-026/FR-027). Each PUT upserts the `main` singleton
 * and immediately invalidates the public cache so the storefront reflects changes
 * within ~1 minute (SC-007). Inputs are Zod-validated at the route, so we accept a
 * plain partial object here (avoids Mongoose DocumentArray type friction).
 */
export async function updateWebsiteSettings(patch: Record<string, unknown>): Promise<WebsiteSettingsDoc> {
  await connectDB();
  const doc = await WebsiteSettings.findOneAndUpdate(
    { singleton: "main" },
    { $set: { ...patch, singleton: "main" } },
    { new: true, upsert: true },
  ).lean();
  await invalidateSettings();
  return doc as WebsiteSettingsDoc;
}

export async function updateThemeSettings(patch: Record<string, unknown>): Promise<ThemeSettingsDoc> {
  await connectDB();
  const doc = await ThemeSettings.findOneAndUpdate(
    { singleton: "main" },
    { $set: { ...patch, singleton: "main" } },
    { new: true, upsert: true },
  ).lean();
  await invalidateTheme();
  return doc as ThemeSettingsDoc;
}
