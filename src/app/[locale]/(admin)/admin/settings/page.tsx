import { getWebsiteSettings } from "@/services/settings.service";
import { SettingsForm, type SettingsInitial } from "@/components/admin/settings/SettingsForm";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

/** Admin website settings UI (FR-026). */
export default async function AdminSettingsPage() {
  const s = await getWebsiteSettings();
  const storeName = (s.storeName ?? { en: "", ar: "" }) as LocalizedText;
  const announcement = (s.header?.announcement ?? { en: "", ar: "" }) as LocalizedText;
  const about = (s.aboutPage?.body ?? { en: "", ar: "" }) as LocalizedText;
  const seoDesc = (s.seo?.description ?? { en: "", ar: "" }) as LocalizedText;
  const logo: MediaRef | null = s.logo?.cloudinaryId
    ? { cloudinaryId: s.logo.cloudinaryId, version: s.logo.version as string, alt: s.logo.alt as LocalizedText }
    : null;

  const initial: SettingsInitial = {
    storeNameEn: storeName.en,
    storeNameAr: storeName.ar,
    announcementEn: announcement.en,
    announcementAr: announcement.ar,
    aboutEn: about.en,
    aboutAr: about.ar,
    contactEmail: s.contactPage?.email ?? "",
    contactPhone: s.contactPage?.phone ?? "",
    contactWhatsapp: s.contactPage?.whatsapp ?? "",
    contactAddress: s.contactPage?.address ?? "",
    seoDescriptionEn: seoDesc.en,
    seoDescriptionAr: seoDesc.ar,
    logo,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Website settings</h1>
      <SettingsForm initial={initial} />
    </div>
  );
}
