import { ComponentProps } from "react";
import { Badge } from "@/components/ui/Badge";

type Tone = ComponentProps<typeof Badge>["tone"];

/** Map an order status to a Badge tone (shared by dashboard + order views). */
export function statusTone(status: string): Tone {
  switch (status) {
    case "delivered":
    case "confirmed":
      return "success";
    case "shipped":
    case "processing":
      return "default";
    case "pending":
      return "muted";
    case "cancelled":
    case "failed":
    case "returned":
    case "refunded":
      return "danger";
    default:
      return "default";
  }
}
