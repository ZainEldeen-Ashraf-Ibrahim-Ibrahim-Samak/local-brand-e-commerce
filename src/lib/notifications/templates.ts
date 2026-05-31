import type { OrderStatus } from "@/lib/shared/types";

/**
 * Localized order-status notification copy (spec FR-014). Messages are bilingual
 * (EN + AR) so the guest understands regardless of the channel locale.
 */
const STATUS_TEXT: Record<OrderStatus, { en: string; ar: string }> = {
  pending: { en: "received and awaiting payment", ar: "تم استلامه وبانتظار الدفع" },
  confirmed: { en: "confirmed", ar: "تم تأكيده" },
  processing: { en: "being prepared", ar: "قيد التجهيز" },
  shipped: { en: "shipped", ar: "تم شحنه" },
  delivered: { en: "delivered", ar: "تم توصيله" },
  cancelled: { en: "cancelled", ar: "تم إلغاؤه" },
  failed: { en: "could not be completed", ar: "تعذّر إتمامه" },
  returned: { en: "marked as returned", ar: "تم تسجيله كمرتجع" },
  refunded: { en: "refunded", ar: "تم استرداد قيمته" },
};

export function orderStatusMessage(orderNumber: string, status: OrderStatus): { subject: string; message: string } {
  const s = STATUS_TEXT[status];
  return {
    subject: `Order ${orderNumber} — ${status}`,
    message:
      `Your order ${orderNumber} is now ${s.en}.\n` +
      `طلبك رقم ${orderNumber} ${s.ar}.`,
  };
}
