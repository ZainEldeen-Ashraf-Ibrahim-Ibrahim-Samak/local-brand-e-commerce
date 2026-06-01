import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/config/env";

// Pure, client-safe helpers live in a separate module so client components can
// import them without pulling in the server-only `cloudinary` SDK. Re-exported
// here for backward compatibility with existing server-side importers.
export { mediaUrl, validateUploadMeta } from "@/lib/media/cloudinary-url";

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

/** Delete an asset from Cloudinary using server-side credentials. */
export async function destroyAsset(cloudinaryId: string): Promise<boolean> {
  const c = configured();
  if (!c) {
    console.error(`[Cloudinary] Cannot delete asset ${cloudinaryId}: Cloudinary is not configured`);
    return false;
  }
  try {
    const result = await c.uploader.destroy(cloudinaryId);
    if (result.result === "ok" || result.result === "not found") {
      return true;
    }
    console.error(`[Cloudinary] Failed to delete asset ${cloudinaryId}:`, result);
    return false;
  } catch (error) {
    console.error(`[Cloudinary] Error deleting asset ${cloudinaryId}:`, error);
    return false;
  }
}
