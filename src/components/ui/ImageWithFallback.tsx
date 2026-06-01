"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { mediaUrl } from "@/lib/media/cloudinary-url";
import type { MediaRef } from "@/lib/shared/types";

interface ImageWithFallbackProps {
  image?: MediaRef | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

export function ImageWithFallback({
  image,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
}: ImageWithFallbackProps) {
  const t = useTranslations("media.placeholder");
  const [error, setError] = useState(false);

  if (!image || !image.cloudinaryId || error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-fg ${className || ""}`}
        style={{
          width: fill ? "100%" : width ? `${width}px` : "100%",
          height: fill ? "100%" : height ? `${height}px` : "100%",
          minHeight: fill ? "100%" : height ? `${height}px` : "150px",
        }}
      >
        <div className="flex flex-col items-center space-y-1 p-4 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 opacity-40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <span className="text-xs font-medium opacity-60">{t("alt")}</span>
        </div>
      </div>
    );
  }

  const src = mediaUrl(image, width || 800);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      loading={priority ? "eager" : "lazy"}
      style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
    />
  );
}
