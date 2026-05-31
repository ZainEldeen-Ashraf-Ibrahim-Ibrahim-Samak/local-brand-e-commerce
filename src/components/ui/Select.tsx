import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Reusable select control. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-token border border-border bg-bg px-3 text-sm text-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
      {...props}
    />
  );
});
