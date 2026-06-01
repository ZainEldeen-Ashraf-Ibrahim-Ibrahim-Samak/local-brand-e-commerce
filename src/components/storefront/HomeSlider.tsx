"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { pickLocale, type LocalizedText, type MediaRef } from "@/lib/shared/types";
import type { AppLocale } from "@/lib/config/env";

export type Slide = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  image?: MediaRef | null;
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

  // Zero-slides empty state (spec FR-024: graceful fallback, Principle I).
  if (slides.length === 0) {
    return (
      <section
        className="flex h-48 items-center justify-center rounded-token bg-muted text-muted-fg md:h-64"
        aria-label="No active slides"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10 opacity-30"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <span className="text-sm font-medium opacity-50">No offers to display</span>
        </div>
      </section>
    );
  }

  const slide = slides[index]!;
  const title = pickLocale(slide.title, locale);
  const subtitle = pickLocale(slide.subtitle, locale);
  const ctaLabel = pickLocale(slide.ctaLabel, locale);
  const imageAlt = slide.image?.alt
    ? pickLocale(slide.image.alt, locale)
    : title;

  return (
    <section className="relative overflow-hidden rounded-token bg-muted">
      {/* Slide image — uses ImageWithFallback so broken/missing images degrade gracefully */}
      <div className="h-64 w-full md:h-80">
        <ImageWithFallback
          image={slide.image ?? undefined}
          alt={imageAlt || title}
          fill
          className="h-full w-full object-cover"
          priority={index === 0}
        />
      </div>

      {/* Overlay with text + CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 p-6 text-center text-white">
        {title && <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>}
        {subtitle && <p className="max-w-xl text-sm md:text-base">{subtitle}</p>}
        {ctaLabel && slide.ctaHref && (
          <Link href={slide.ctaHref}>
            <Button className="mt-2">{ctaLabel}</Button>
          </Link>
        )}
      </div>

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
