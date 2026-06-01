"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Dark/light theme provider (next-themes). Both palettes derive from the same
 * design tokens (Principle II). `defaultMode` comes from admin ThemeSettings.
 *
 * We use `forcedTheme` instead of `defaultTheme` so the admin-configured value
 * always wins, even when the browser has a stale value in localStorage from a
 * previous session. The storageKey encodes the chosen mode so changing it in the
 * admin panel abandons the old key and starts fresh.
 */
export function ThemeProvider({
  children,
  defaultMode = "light",
}: {
  children: ReactNode;
  defaultMode?: "light" | "dark";
}) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme={defaultMode}
      storageKey={`theme-${defaultMode}`}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
