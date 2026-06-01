import { Order } from "@/models/Order";
import { connectDB } from "@/lib/db/connect";
import { PipelineStage } from "mongoose";

/**
 * Customer Records Aggregation Service (Phase 5 User Story 3: T027).
 * Reads-only, aggregates guest customer data from the Order collection,
 * and compiles lookup listings + order history profiles.
 */

export type AggregatedCustomer = {
  email: string;
  name: string;
  whatsapp: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: Date;
};

export async function getCustomerList(query?: { search?: string }): Promise<AggregatedCustomer[]> {
  await connectDB();

  const pipeline: PipelineStage[] = [
    // Group orders by lowercase customer email
    {
      $group: {
        _id: { $toLower: "$customer.email" },
        email: { $first: { $toLower: "$customer.email" } },
        name: { $last: "$customer.name" },
        whatsapp: { $last: "$customer.whatsapp" },
        orderCount: { $sum: 1 },
        totalSpend: { $sum: "$grandTotal" },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
    // Sort newest order first by default
    {
      $sort: { lastOrderAt: -1 },
    },
  ];

  // Apply optional search filter
  if (query?.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    pipeline.push({
      $match: {
        $or: [
          { email: searchRegex },
          { name: searchRegex },
          { whatsapp: searchRegex },
        ],
      },
    });
  }

  return Order.aggregate(pipeline);
}

export async function getCustomerDetail(email: string) {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();

  // Find all orders associated with this customer email
  const orders = await Order.find({ "customer.email": normalizedEmail }).sort({ createdAt: -1 });
  
  if (orders.length === 0) {
    throw new Error("Customer not found");
  }

  // Extract contact info from the latest order
  const latestOrder = orders[0];
  if (!latestOrder || !latestOrder.customer) {
    throw new Error("Customer data is corrupted");
  }
  const customer = {
    email: normalizedEmail,
    name: latestOrder.customer.name,
    whatsapp: latestOrder.customer.whatsapp,
  };

  return {
    customer,
    orders,
  };
}
