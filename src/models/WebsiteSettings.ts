import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };
const mediaRef = { cloudinaryId: String, version: String, alt: { en: String, ar: String } };

/** Store identity & content singleton (spec FR-026). Exactly one active doc. */
const websiteSettingsSchema = new Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    storeName: localized,
    logo: mediaRef,
    header: {
      announcement: localized,
      navLinks: [{ label: localized, href: String }],
    },
    footer: {
      aboutShort: localized,
      columns: [{ title: localized, links: [{ label: localized, href: String }] }],
    },
    contactPage: { body: localized, email: String, phone: String, whatsapp: String, address: String },
    aboutPage: { body: localized },
    socialLinks: [{ platform: String, url: String }],
    seo: { description: localized, keywords: [String] },
  },
  { timestamps: true },
);

export type WebsiteSettingsDoc = InferSchemaType<typeof websiteSettingsSchema>;

export const WebsiteSettings: mongoose.model<WebsiteSettingsDoc> =
  (mongoose.models.WebsiteSettings as mongoose.model<WebsiteSettingsDoc>) ??
  mongoose.model<WebsiteSettingsDoc>("WebsiteSettings", websiteSettingsSchema);
