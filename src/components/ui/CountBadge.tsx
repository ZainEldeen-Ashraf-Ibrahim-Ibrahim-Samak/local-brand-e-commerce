import { cn } from "@/lib/shared/cn";

/**
 * Numeric indicator badge for cart / favorites / compare controls (feature 005, FR-017).
 * Renders nothing when count is 0 (zero state). Uses design tokens — no hard-coded colors.
 */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count || count < 1) return null;
  return (
    <span
      aria-label={`${count} items`}
      className={cn(
        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 py-0.5",
        "text-[0.65rem] font-semibold leading-none text-primary-fg",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
