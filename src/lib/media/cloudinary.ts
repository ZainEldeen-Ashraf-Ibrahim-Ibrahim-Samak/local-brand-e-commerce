import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/config/env";
import type { MediaRef } from "@/lib/shared/types";

/**
 * Cloudinary helpers. Credentials stay server-side (Principle III); admin uploads
 * go through a signed payload so the client never holds the API secret.
 */
function configured() {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return null;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

/** Produce signed params for a direct (server-authorized) browser upload. */
export function signUpload(folder = "products"): { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string } {
  const c = configured();
  const env = getEnv();
  if (!c) throw new Error("Cloudinary is not configured");
  const timestamp = Math.round(Date.now() / 1000);
  const signature = c.utils.api_sign_request({ timestamp, folder }, env.CLOUDINARY_API_SECRET!);
  return { timestamp, signature, apiKey: env.CLOUDINARY_API_KEY!, cloudName: env.CLOUDINARY_CLOUD_NAME!, folder };
}

/** Build a responsive, format-optimized delivery URL for a stored asset. */
export function mediaUrl(ref: MediaRef, width = 800): string {
  const cloud = getEnv().CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/v${ref.version}/${ref.cloudinaryId}`;
}
