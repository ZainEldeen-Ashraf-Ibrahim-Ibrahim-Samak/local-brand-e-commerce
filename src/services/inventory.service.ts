import { connectDB } from "@/lib/db/connect";
import { Variation } from "@/models/Variation";
import { Errors } from "@/lib/http/errors";

/**
 * Inventory reservation (research R3, spec FR-034 / SC-010).
 *
 * Each decrement is an ATOMIC conditional update (`stock >= qty` filter + `$inc`),
 * which is the source of truth that prevents overselling even under concurrency.
 * Across multiple lines we compensate (restore) already-reserved items if any
 * line fails, so an order is all-or-nothing without requiring a replica-set
 * transaction.
 */
export type StockItem = { variationId: string; quantity: number };

/** Atomically reserve stock for all items, or throw OUT_OF_STOCK (restoring any partial reservations). */
export async function reserveStock(items: StockItem[]): Promise<void> {
  await connectDB();
  const reserved: StockItem[] = [];
  const unavailable: string[] = [];

  for (const item of items) {
    const res = await Variation.updateOne(
      { _id: item.variationId, isActive: true, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );
    if (res.modifiedCount === 1) {
      reserved.push(item);
    } else {
      unavailable.push(item.variationId);
      break; // stop at first failure; compensate below
    }
  }

  if (unavailable.length > 0) {
    // Compensate: restore stock for items we already decremented.
    await restoreStock(reserved);
    throw Errors.outOfStock({ unavailable });
  }
}

/** Restore previously reserved stock (e.g. payment failed/abandoned, or order cancelled). */
export async function restoreStock(items: StockItem[]): Promise<void> {
  if (items.length === 0) return;
  await connectDB();
  await Promise.all(
    items.map((item) =>
      Variation.updateOne({ _id: item.variationId }, { $inc: { stock: item.quantity } }),
    ),
  );
}
