import mongoose, { Schema, type InferSchemaType } from "mongoose";

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
    privacyPage: { body: localized },
    termsPage: { body: localized },
    hero: {
      background: mediaRef,
      heading: localized,
      subtext: localized,
      cta: { label: localized, href: { type: String, default: "" } },
      showHeading: { type: Boolean, default: true },
      showSubtext: { type: Boolean, default: true },
      showCta: { type: Boolean, default: true },
    },
    currency: {
      base: { type: String, default: "USD" },
      active: { type: String, default: "USD" },
      options: {
        type: [{ code: String, label: localized, symbol: String, rate: { type: Number, default: 1 } }],
        default: [{ code: "USD", label: { en: "US Dollar", ar: "دولار أمريكي" }, symbol: "$", rate: 1 }],
      },
    },
    homeSections: {
      type: [{ key: String, isVisible: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } }],
      default: [],
    },
    socialLinks: [{ platform: String, url: String }],
    seo: { description: localized, keywords: [String] },
  },
  { timestamps: true },
);

export type WebsiteSettingsDoc = InferSchemaType<typeof websiteSettingsSchema>;

export const WebsiteSettings: mongoose.Model<WebsiteSettingsDoc> =
  (mongoose.models.WebsiteSettings as mongoose.Model<WebsiteSettingsDoc>) ??
  mongoose.model<WebsiteSettingsDoc>("WebsiteSettings", websiteSettingsSchema);
