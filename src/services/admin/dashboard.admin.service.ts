import { connectDB } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Variation } from "@/models/Variation";
import { Product } from "@/models/Product";

/**
 * Admin dashboard summary (spec FR-021 dashboard). Aggregates sales + inventory
 * health for the operator landing page. Revenue counts non-failed/cancelled orders.
 */
const REVENUE_STATUSES = ["confirmed", "processing", "shipped", "delivered", "returned", "refunded"];
const LOW_STOCK_THRESHOLD = 5;

export type DashboardSummary = {
  sales: {
    totalOrders: number;
    revenue: number;
    ordersByStatus: Record<string, number>;
    recent: Array<{ id: string; orderNumber: string; status: string; grandTotal: number; createdAt: Date }>;
  };
  inventory: {
    totalProducts: number;
    publishedProducts: number;
    totalVariations: number;
    outOfStock: number;
    lowStock: number;
  };
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await connectDB();

  const [byStatus, revenueAgg, recent, totalOrders] = await Promise.all([
    Order.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate<{ _id: null; revenue: number }>([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, revenue: { $sum: "$grandTotal" } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    Order.countDocuments(),
  ]);

  const [totalProducts, publishedProducts, totalVariations, outOfStock, lowStock] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: "published" }),
    Variation.countDocuments(),
    Variation.countDocuments({ stock: 0 }),
    Variation.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
  ]);

  const ordersByStatus: Record<string, number> = {};
  for (const s of byStatus) ordersByStatus[s._id] = s.count;

  return {
    sales: {
      totalOrders,
      revenue: revenueAgg[0]?.revenue ?? 0,
      ordersByStatus,
      recent: recent.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        status: o.status,
        grandTotal: o.grandTotal,
        createdAt: o.createdAt as Date,
      })),
    },
    inventory: { totalProducts, publishedProducts, totalVariations, outOfStock, lowStock },
  };
}
