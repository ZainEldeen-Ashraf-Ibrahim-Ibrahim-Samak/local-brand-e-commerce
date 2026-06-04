import { z } from "zod";
import { localizedTextSchema, mediaRefSchema } from "@/lib/shared/types";

/**
 * Shared Zod schemas for admin content/hero/currency/slider/category writes
 * (feature 005). Routes parse with these so server-side validation is consistent
 * (Constitution Principle III). All text is localized {en, ar}.
 */
const linkSchema = z.object({ label: localizedTextSchema, href: z.string() });

export const contentSchema = z
  .object({
    header: z.object({ announcement: localizedTextSchema, navLinks: z.array(linkSchema) }),
    footer: z.object({
      aboutShort: localizedTextSchema,
      columns: z.array(z.object({ title: localizedTextSchema, links: z.array(linkSchema) })),
    }),
    aboutPage: z.object({ body: localizedTextSchema }),
    contactPage: z.object({
      body: localizedTextSchema,
      email: z.string(),
      phone: z.string(),
      whatsapp: z.string(),
      address: z.string(),
    }),
    privacyPage: z.object({ body: localizedTextSchema }),
    termsPage: z.object({ body: localizedTextSchema }),
    homeSections: z.array(
      z.object({ key: z.string(), isVisible: z.boolean(), sortOrder: z.number() }),
    ),
  })
  .partial();

export const heroSchema = z.object({
  background: mediaRefSchema.optional(),
  heading: localizedTextSchema,
  subtext: localizedTextSchema,
  cta: z.object({ label: localizedTextSchema, href: z.string() }),
  showHeading: z.boolean(),
  showSubtext: z.boolean(),
  showCta: z.boolean(),
});

const currencyOptionSchema = z.object({
  code: z.string().min(1),
  label: localizedTextSchema,
  symbol: z.string().min(1),
  rate: z.number().positive(),
});

export const currencySchema = z
  .object({
    base: z.string().min(1),
    active: z.string().min(1),
    options: z.array(currencyOptionSchema).min(1),
  })
  .refine((c) => c.options.some((o) => o.code === c.active), {
    message: "active currency must be one of options[].code",
    path: ["active"],
  })
  .refine((c) => c.options.find((o) => o.code === c.base)?.rate === 1, {
    message: "base currency option must have rate === 1",
    path: ["base"],
  });

export const sliderSchema = z.object({
  placement: z.enum(["hero", "offer"]).default("offer"),
  title: localizedTextSchema,
  subtitle: localizedTextSchema,
  image: mediaRefSchema.optional(),
  ctaLabel: localizedTextSchema,
  ctaHref: z.string().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
});

export const categorySchema = z.object({
  name: localizedTextSchema,
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  parent: z.string().nullable().optional(),
  image: z.object({ cloudinaryId: z.string(), version: z.string(), alt: localizedTextSchema.optional() }).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export type ContentInput = z.infer<typeof contentSchema>;
export type HeroInput = z.infer<typeof heroSchema>;
export type CurrencyInput = z.infer<typeof currencySchema>;
export type SliderInput = z.infer<typeof sliderSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
