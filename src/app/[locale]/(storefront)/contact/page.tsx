import { getWebsiteSettings } from "@/services/settings.service";
import { pickLocale } from "@/lib/shared/types";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/config/env";
import { ContactForm } from "@/components/storefront/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "contact" });
  const settings = await getWebsiteSettings();

  const body = pickLocale(settings.contactPage?.body ?? { en: "", ar: "" }, lc);
  const email = settings.contactPage?.email;
  const phone = settings.contactPage?.phone;
  const whatsapp = settings.contactPage?.whatsapp;
  const address = settings.contactPage?.address;

  const hasContactInfo = body || email || phone || whatsapp || address;
  const hasSocials = settings.socialLinks && settings.socialLinks.length > 0;
  const hasContent = hasContactInfo || hasSocials;

  return (
    <div className="mx-auto max-w-6xl py-6 space-y-8">
      <div className="space-y-2 text-center md:text-start">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{t("title")}</h1>
        {body && <p className="text-muted-fg max-w-2xl whitespace-pre-wrap">{body}</p>}
      </div>

      {!hasContent ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-fg">
          {t("noContent")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contact Details Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-fg">{t("title")}</h2>
              
              <div className="space-y-4">
                {email && (
                  <div className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg">✉</span>
                    <div>
                      <h3 className="font-semibold text-fg">{t("email")}</h3>
                      <a href={`mailto:${email}`} className="text-sm text-muted-fg hover:text-primary">
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg">📞</span>
                    <div>
                      <h3 className="font-semibold text-fg">{t("phone")}</h3>
                      <a href={`tel:${phone}`} className="text-sm text-muted-fg hover:text-primary">
                        {phone}
                      </a>
                    </div>
                  </div>
                )}

                {whatsapp && (
                  <div className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg">💬</span>
                    <div>
                      <h3 className="font-semibold text-fg">WhatsApp</h3>
                      <a
                        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                        className="text-sm text-muted-fg hover:text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg">📍</span>
                    <div>
                      <h3 className="font-semibold text-fg">{t("address")}</h3>
                      <p className="text-sm text-muted-fg whitespace-pre-wrap">{address}</p>
                    </div>
                  </div>
                )}
              </div>

              {hasSocials && (
                <div className="pt-6 border-t border-border space-y-3">
                  <h3 className="font-semibold text-fg">{t("followUs")}</h3>
                  <div className="flex flex-wrap gap-4">
                    {settings.socialLinks.map((s) => (
                      <a
                        key={s.url ?? s.platform}
                        href={s.url ?? "#"}
                        className="text-sm text-muted-fg hover:text-fg hover:underline focus:outline-none focus:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Side */}
          <div>
            <ContactForm />
          </div>
        </div>
      )}
    </div>
  );
}
