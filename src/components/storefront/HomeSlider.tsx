"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import { mediaUrl } from "@/lib/media/cloudinary";
import { pickLocale, type LocalizedText, type MediaRef } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export type Slide = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  image?: MediaRef;
  ctaLabel: LocalizedText;
  ctaHref: string;
};

/** Auto-advancing homepage slider rendered from admin Offers (FR-024, Principle I). */
export function HomeSlider({ slides, locale }: { slides: Slide[]; locale: AppLocale }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const slide = slides[index];
  if (!slide) return null;
  const title = pickLocale(slide.title, locale);
  const subtitle = pickLocale(slide.subtitle, locale);
  const ctaLabel = pickLocale(slide.ctaLabel, locale);

  return (
    <section className="relative overflow-hidden rounded-token bg-muted">
      {slide.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(slide.image, 1600)}
          alt={pickLocale(slide.image.alt ?? { en: "", ar: "" }, locale) || title}
          className="h-64 w-full object-cover md:h-80"
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 p-6 text-center text-white">
        {title && <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>}
        {subtitle && <p className="max-w-xl text-sm md:text-base">{subtitle}</p>}
        {ctaLabel && slide.ctaHref && (
          <Link href={slide.ctaHref}>
            <Button className="mt-2">{ctaLabel}</Button>
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
