import { connectDB } from "@/lib/db/connect";
import { TaxShippingPolicy, type TaxShippingPolicyDoc } from "@/models/TaxShippingPolicy";

/**
 * Admin tax + shipping policy writer (spec FR-028). PUT upserts the `main` singleton
 * and invalidates the cache so checkout quotes reflect new tax/shipping immediately.
 */
export async function updateTaxShippingPolicy(patch: Record<string, unknown>): Promise<TaxShippingPolicyDoc> {
  await connectDB();
  const doc = await TaxShippingPolicy.findOneAndUpdate(
    { singleton: "main" },
    { $set: { ...patch, singleton: "main" } },
    { new: true, upsert: true },
  ).lean();
  return doc as TaxShippingPolicyDoc;
}
