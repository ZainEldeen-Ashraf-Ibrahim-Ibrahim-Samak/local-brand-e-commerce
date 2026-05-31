/**
 * Design-token layer (Constitution Principle I & V). ThemeSettings stored by the
 * admin are resolved into CSS custom properties injected on <html>, which Tailwind
 * consumes (see tailwind.config.ts). No component hard-codes colors/fonts.
 */
export type TokenMap = {
  "--color-primary": string;
  "--color-primary-fg": string;
  "--color-secondary": string;
  "--color-secondary-fg": string;
  "--color-bg": string;
  "--color-fg": string;
  "--color-muted": string;
  "--color-muted-fg": string;
  "--color-border": string;
  "--color-danger": string;
  "--color-success": string;
  "--font-family": string;
  "--radius": string;
};

export type ThemeTokenInput = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  baseFontSizePx: number;
  palette?: { light?: Partial<TokenMap>; dark?: Partial<TokenMap> };
};

const LIGHT_DEFAULTS: TokenMap = {
  "--color-primary": "#1f2937",
  "--color-primary-fg": "#ffffff",
  "--color-secondary": "#d97706",
  "--color-secondary-fg": "#ffffff",
  "--color-bg": "#ffffff",
  "--color-fg": "#111827",
  "--color-muted": "#f3f4f6",
  "--color-muted-fg": "#6b7280",
  "--color-border": "#e5e7eb",
  "--color-danger": "#dc2626",
  "--color-success": "#16a34a",
  "--font-family": 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  "--radius": "0.5rem",
};

/** Build the light/dark token maps from admin ThemeSettings. */
export function resolveTokens(input: ThemeTokenInput): { light: TokenMap; dark: TokenMap } {
  const base: TokenMap = {
    ...LIGHT_DEFAULTS,
    "--color-primary": input.primaryColor,
    "--color-secondary": input.secondaryColor,
    "--font-family": input.fontFamily,
  };
  const light: TokenMap = { ...base, ...(input.palette?.light ?? {}) };
  const dark: TokenMap = {
    ...base,
    "--color-bg": "#0b0f17",
    "--color-fg": "#f3f4f6",
    "--color-muted": "#1f2937",
    "--color-muted-fg": "#9ca3af",
    "--color-border": "#374151",
    ...(input.palette?.dark ?? {}),
  };
  return { light, dark };
}

/** Serialize a token map into an inline `style` string for SSR injection. */
export function tokensToStyle(tokens: Partial<TokenMap>): string {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
