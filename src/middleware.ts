import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Locale routing middleware (next-intl). Authorization for /admin and /seller is
 * enforced server-side in their route-group layouts (requireRole) AND re-checked
 * in every API handler via guards (defense in depth, Constitution Principle III/IV).
 */
export default createIntlMiddleware(routing);

export const config = {
  // Run on everything except API, Next internals, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
