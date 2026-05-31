"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Dark/light theme provider (next-themes). Both palettes derive from the same
 * design tokens (Principle II). `defaultTheme` comes from admin ThemeSettings.
 */
export function ThemeProvider({
  children,
  defaultMode = "light",
}: {
  children: ReactNode;
  defaultMode?: "light" | "dark";
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultMode} enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
