"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Browser-local compare list (feature 005, FR-015/FR-016/FR-020). Capped at 3 items;
 * adding beyond the cap is rejected so the caller can prompt the shopper to remove one.
 */
export type CompareItem = {
  productSlug: string;
  name: { en: string; ar: string };
  basePrice: number;
  image?: { cloudinaryId: string; version: string };
};

export const COMPARE_MAX = 3;

const KEY = "lb_cmp_v1";
const EVENT = "lb_cmp_change";

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CompareItem[];
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const has = useCallback((slug: string) => items.some((i) => i.productSlug === slug), [items]);

  /** Returns false (and does not add) when the list is already at COMPARE_MAX. */
  const add = useCallback((item: CompareItem): boolean => {
    const next = read();
    if (next.some((i) => i.productSlug === item.productSlug)) return true;
    if (next.length >= COMPARE_MAX) return false;
    next.push(item);
    write(next);
    return true;
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((i) => i.productSlug !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  const isFull = items.length >= COMPARE_MAX;

  return { items, has, add, remove, clear, isFull, count: items.length, max: COMPARE_MAX };
}
