"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggleLocale() {
    const nextLocale = locale === "en" ? "ar" : "en";
    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    
    router.replace(href, { locale: nextLocale });
  }

  return (
    <button 
      onClick={toggleLocale} 
      className="p-1.5 text-fg hover:text-primary transition-colors focus:outline-none rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" 
      aria-label="Switch language"
      title="Switch Language"
      suppressHydrationWarning
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
        <path d="M2 12h20"/>
      </svg>
    </button>
  );
}
