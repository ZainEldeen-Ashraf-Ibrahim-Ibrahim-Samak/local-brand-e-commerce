type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/** Map an order status to a Badge tone (shared by dashboard + order views). */
export function statusTone(status: string): Tone {
  switch (status) {
    case "delivered":
    case "confirmed":
    case "refunded":
      return "success";
    case "shipped":
    case "processing":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
    case "failed":
    case "returned":
      return "danger";
    default:
      return "neutral";
  }
}
