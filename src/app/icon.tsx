import { NextResponse } from "next/server";
import { getWebsiteSettings } from "@/services/settings.service";

// Next.js picks up src/app/icon.tsx as the site icon route automatically.
// Returning a redirect is the lightest approach — the browser follows it to the
// Cloudinary CDN URL (or the static fallback) and caches it there.
export const dynamic = "force-dynamic";
export const revalidate = 300; // re-check every 5 minutes

// Declare the icon size and content type for Next.js metadata
export const size = { width: 32, height: 32 };
export const contentType = "image/x-icon";

export default async function Icon() {
  try {
    const settings = await getWebsiteSettings();
    const logo = settings.logo;

    if (logo?.cloudinaryId && logo?.version) {
      const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
      // Use a small, square crop optimised for favicon use
      const url = `https://res.cloudinary.com/${cloud}/image/upload/c_fill,w_32,h_32,f_png,q_auto/v${logo.version}/${logo.cloudinaryId}`;
      return NextResponse.redirect(url, { status: 302 });
    }
  } catch {
    // DB unavailable — fall through to static fallback
  }

  // Fallback: serve the static favicon.ico from /public
  return NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"), { status: 302 });
}
