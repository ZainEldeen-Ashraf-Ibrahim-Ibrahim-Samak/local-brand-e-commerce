import type { MediaRef } from "@/lib/shared/types";

/**
 * Pure, client-safe Cloudinary helpers. These build delivery URLs and validate
 * upload metadata without touching the server-only `cloudinary` SDK (which pulls
 * in Node's `fs` and cannot be bundled into client components).
 */

/**
 * The Cloudinary cloud name is public (it appears in every delivery URL), so we
 * read it from a `NEXT_PUBLIC_` var. Next.js inlines this at build time for both
 * the server and client bundles, so `mediaUrl` produces identical output on each
 * side — avoiding React hydration mismatches.
 */
function publicCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
}

/** Build a responsive, format-optimized delivery URL for a stored asset. */
export function mediaUrl(ref: MediaRef, width = 800): string {
  const cloud = publicCloudName();
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/v${ref.version}/${ref.cloudinaryId}`;
}

/** Validate upload format and size limits. Accepts jpg, jpeg, png, webp and <= 5MB. */
export function validateUploadMeta(meta: { format?: string; bytes?: number }): boolean {
  if (!meta || !meta.format || meta.bytes === undefined) return false;
  const validFormats = ["jpg", "jpeg", "png", "webp"];
  const format = meta.format.toLowerCase();
  const maxBytes = 5 * 1024 * 1024;
  return validFormats.includes(format) && meta.bytes <= maxBytes;
}
