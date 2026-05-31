import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

/** Reusable text input (logical properties keep it RTL/LTR correct). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-token border bg-bg px-3 text-sm text-fg placeholder:text-muted-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
});
