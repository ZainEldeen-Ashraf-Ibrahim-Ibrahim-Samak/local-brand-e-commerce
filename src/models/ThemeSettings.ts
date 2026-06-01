import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Admin-driven theme singleton (spec FR-027, research R7). Exactly one active doc. */
const themeSettingsSchema = new Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    primaryColor: { type: String, default: "#1f2937" },
    secondaryColor: { type: String, default: "#d97706" },
    fontFamily: { type: String, default: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
    baseFontSizePx: { type: Number, default: 16 },
    layout: { type: String, enum: ["classic", "compact", "wide"], default: "classic" },
    defaultMode: { type: String, enum: ["light", "dark"], default: "light" },
    defaultLanguage: { type: String, enum: ["ar", "en"], default: "ar" },
    palette: {
      light: { type: Schema.Types.Mixed, default: {} },
      dark: { type: Schema.Types.Mixed, default: {} },
    },
  },
  { timestamps: true },
);

export type ThemeSettingsDoc = InferSchemaType<typeof themeSettingsSchema>;

export const ThemeSettings: mongoose.Model<ThemeSettingsDoc> =
  (mongoose.models.ThemeSettings as mongoose.Model<ThemeSettingsDoc>) ??
  mongoose.model<ThemeSettingsDoc>("ThemeSettings", themeSettingsSchema);
