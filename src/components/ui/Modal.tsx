"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/shared/cn";

/** Reusable accessible modal dialog (Esc to close, backdrop click, focus trap-lite). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={cn("w-full max-w-lg rounded-token border border-border bg-bg p-6 shadow-lg", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-fg">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
