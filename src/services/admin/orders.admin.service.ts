import { connectDB } from "@/lib/db/connect";
import { Order, type OrderDoc } from "@/models/Order";
import { Errors } from "@/lib/http/errors";
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/shared/types";
import type { FilterQuery } from "mongoose";

/**
 * Admin order read helpers (spec FR-020/FR-021). Status transitions themselves live
 * in `order.service.transitionOrder` (validated lifecycle + notification dispatch).
 */
export type AdminOrderQuery = {
  status?: OrderStatus;
  /** Multiple statuses for logical-group filtering (?completion=). */
  statuses?: OrderStatus[];
  q?: string; // matches order number or customer email
  page?: number;
  pageSize?: number;
};

export async function listAdminOrders(query: AdminOrderQuery): Promise<{
  items: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    grandTotal: number;
    createdAt: Date;
    expiresAt?: Date | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
}> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const filter: FilterQuery<OrderDoc> = {};

  if (query.statuses && query.statuses.length > 0) {
    filter.status = { $in: query.statuses };
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.q) {
    filter.$or = [
      { orderNumber: { $regex: query.q, $options: "i" } },
      { "customer.email": { $regex: query.q, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: docs.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customerName: o.customer?.name ?? "",
      customerEmail: o.customer?.email ?? "",
      status: o.status,
      grandTotal: o.grandTotal,
      createdAt: o.createdAt as Date,
      expiresAt: (o as { expiresAt?: Date | null }).expiresAt ?? null,
    })),
    page,
    pageSize,
    total,
  };
}

export async function getAdminOrder(id: string): Promise<OrderDoc & { _id: unknown }> {
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) throw Errors.notFound("Order");
  return order as OrderDoc & { _id: unknown };
}

/** Allowed next statuses for an order (used to render valid transition controls). */
export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[from] ?? [];
}

export { ORDER_STATUSES };
