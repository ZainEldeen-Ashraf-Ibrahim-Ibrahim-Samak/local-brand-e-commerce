import type { HTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

type Tone = "default" | "success" | "danger" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-primary text-primary-fg",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
  muted: "bg-muted text-muted-fg",
};

/** Small status pill (e.g. order status, stock state). */
export function Badge({ tone = "default", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
