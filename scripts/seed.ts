/**
 * Seed script (task T029). Idempotently creates:
 *  - the singleton WebsiteSettings / ThemeSettings / TaxShippingPolicy (defaults)
 *  - a first admin account from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *
 * Demo catalog seeding (categories/products/variations) is added alongside the
 * US1 catalog models. Run with: `npm run db:seed` (loads .env.local via --env-file).
 */
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { WebsiteSettings } from "@/models/WebsiteSettings";
import { ThemeSettings } from "@/models/ThemeSettings";
import { TaxShippingPolicy } from "@/models/TaxShippingPolicy";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { Variation } from "@/models/Variation";

async function ensureSingleton(
  model: {
    findOne: (filter: { singleton: string }) => unknown;
    create: (doc: object) => Promise<unknown>;
  },
  defaults: object,
  label: string
) {
  const exists = await model.findOne({ singleton: "main" });
  if (exists) {
    console.log(`= ${label} already exists`);
    return;
  }
  await model.create({ singleton: "main", ...defaults });
  console.log(`+ created ${label}`);
}

async function main() {
  await connectDB();

  await ensureSingleton(
    WebsiteSettings,
    { storeName: { en: "Local Brand", ar: "العلامة المحلية" }, seo: { description: { en: "", ar: "" }, keywords: [] } },
    "WebsiteSettings",
  );
  await ensureSingleton(ThemeSettings, {}, "ThemeSettings");
  await ensureSingleton(
    TaxShippingPolicy,
    {
      tax: { rateBasisPoints: 1400, inclusive: false, label: { en: "VAT", ar: "ضريبة" } },
      shippingOptions: [
        { id: "standard", label: { en: "Standard", ar: "عادي" }, cost: 3000, estimatedDays: 5, isActive: true },
        { id: "express", label: { en: "Express", ar: "سريع" }, cost: 7000, estimatedDays: 2, isActive: true },
        { id: "delivery", label: { en: "Home Delivery", ar: "توصيل للمنزل" }, cost: 5000, estimatedDays: 3, isActive: true },
        { id: "pickup", label: { en: "Store Pickup", ar: "استلام من المتجر" }, cost: 0, estimatedDays: 1, isActive: true },
      ],
    },
    "TaxShippingPolicy",
  );

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  let adminId: unknown = null;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = "admin";
      existing.isActive = true;
      existing.status = "active";
      await existing.save();
      adminId = existing._id;
      console.log("= admin user updated (synced password)");
    } else {
      const admin = await User.create({ email, passwordHash, role: "admin", name: "Administrator", isActive: true, status: "active" });
      adminId = admin._id;
      console.log(`+ created admin user ${email}`);
    }
  } else {
    console.log("! SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set; skipping admin creation");
  }

  // Demo catalog (idempotent by slug) so the storefront has browsable products.
  if (adminId) {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const tshirts = await Category.create({ slug: "t-shirts", name: { en: "T-Shirts", ar: "تيشيرتات" } });
      const demo = [
        { slug: "classic-tee", en: "Classic Tee", ar: "تيشيرت كلاسيك", price: 4500 },
        { slug: "premium-tee", en: "Premium Tee", ar: "تيشيرت بريميوم", price: 6500 },
      ];
      for (const d of demo) {
        const product = await Product.create({
          slug: d.slug,
          name: { en: d.en, ar: d.ar },
          description: { en: "Soft cotton tee.", ar: "تيشيرت قطن ناعم." },
          category: tshirts._id,
          basePrice: d.price,
          images: [{ cloudinaryId: "samples/ecommerce/shoes", version: "1" }],
          attributes: [
            { key: "size", label: { en: "Size", ar: "المقاس" }, values: ["S", "M", "L"] },
            { key: "color", label: { en: "Color", ar: "اللون" }, values: ["black", "white"] },
          ],
          status: "published",
          ownerUserId: adminId,
        });
        for (const size of ["S", "M", "L"]) {
          for (const color of ["black", "white"]) {
            await Variation.create({
              product: product._id,
              sku: `${d.slug}-${size}-${color}`,
              options: { size, color },
              stock: 10,
            });
          }
        }
        console.log(`+ created product ${d.slug} with 6 variations`);
      }
    } else {
      console.log("= categories already exist; skipping demo catalog");
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
