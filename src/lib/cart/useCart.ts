"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Guest cart held in localStorage (no account required, spec FR-007). Authoritative
 * pricing/availability is always recomputed server-side at validate/checkout.
 */
export type CartItem = {
  variationId: string;
  productSlug: string;
  name: { en: string; ar: string };
  options: Record<string, string>;
  unitPrice: number;
  quantity: number;
  /** Variation image if set, else the product's first image (for cart/checkout display). */
  image?: { cloudinaryId: string; version: string };
};

const KEY = "lb_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CartItem[];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("lb_cart_change"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("lb_cart_change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("lb_cart_change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((item: CartItem) => {
    const next = read();
    const existing = next.find((i) => i.variationId === item.variationId);
    if (existing) existing.quantity += item.quantity;
    else next.push(item);
    write(next);
  }, []);

  const setQuantity = useCallback((variationId: string, quantity: number) => {
    const next = read()
      .map((i) => (i.variationId === variationId ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    write(next);
  }, []);

  const remove = useCallback((variationId: string) => {
    write(read().filter((i) => i.variationId !== variationId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

  return { items, add, setQuantity, remove, clear, count, subtotal };
}
