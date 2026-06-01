"use client";

import { useState } from "react";
import { ImageWithFallback } from "@/components/ui";
import type { MediaRef } from "@/lib/shared/types";

/**
 * Storefront product gallery: a large main image plus clickable thumbnails.
 * Selecting a thumbnail switches the main image. Can be controlled by a parent
 * (pass `selectedIndex` + `onSelect`) so variant selection and image selection
 * stay in sync; otherwise it manages its own selection.
 */
export function ProductGallery({
  images,
  alt,
  selectedIndex,
  onSelect,
}: {
  images: MediaRef[];
  alt: string;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const selected = selectedIndex ?? internal;
  const select = (i: number) => (onSelect ? onSelect(i) : setInternal(i));

  const main = images[selected] ?? images[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-token bg-muted">
        <ImageWithFallback image={main} alt={alt} fill priority />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={img.cloudinaryId ?? i}
              type="button"
              onClick={() => select(i)}
              aria-label={`${alt} — image ${i + 1}`}
              aria-current={i === selected}
              className={`relative aspect-square overflow-hidden rounded-token bg-muted transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                i === selected ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50"
              }`}
            >
              <ImageWithFallback image={img} alt={alt} fill />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
