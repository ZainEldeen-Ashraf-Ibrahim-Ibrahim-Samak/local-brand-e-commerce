import type { HTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

/** Reusable surface card used by product/offer/order/buyer cards (Principle I). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-token border border-border bg-bg shadow-sm", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
