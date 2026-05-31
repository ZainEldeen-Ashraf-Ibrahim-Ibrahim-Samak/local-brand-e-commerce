import type { Config } from "tailwindcss";

/**
 * Colors/fonts map to CSS custom properties resolved at runtime from ThemeSettings
 * (see src/lib/design-tokens). No hard-coded brand colors live here (Constitution Principle I).
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-fg": "var(--color-primary-fg)",
        secondary: "var(--color-secondary)",
        "secondary-fg": "var(--color-secondary-fg)",
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        "muted-fg": "var(--color-muted-fg)",
        border: "var(--color-border)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
      },
      fontFamily: {
        sans: "var(--font-family)",
      },
      borderRadius: {
        token: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;
