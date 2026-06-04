import { getWebsiteSettings } from "@/services/settings.service";
import { pickLocale } from "@/lib/shared/types";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/config/env";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const settings = await getWebsiteSettings();

  const page = (settings as { privacyPage?: { body?: { en: string; ar: string } } }).privacyPage;
  const body = pickLocale(page?.body ?? { en: "", ar: "" }, lc);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">{t("title")}</h1>
      {body ? (
        <div className="prose prose-neutral dark:prose-invert max-w-none text-fg leading-relaxed whitespace-pre-wrap">
          {body}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-fg">
          {t("noContent")}
        </div>
      )}
    </div>
  );
}
