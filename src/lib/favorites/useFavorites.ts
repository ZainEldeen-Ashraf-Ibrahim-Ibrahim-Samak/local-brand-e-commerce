"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Browser-local favorites (feature 005, FR-013/FR-020). No account required and no
 * cross-device sync — mirrors the guest-cart pattern in `lib/cart/useCart.ts`.
 */
export type FavoriteItem = {
  productSlug: string;
  name: { en: string; ar: string };
  basePrice: number;
  image?: { cloudinaryId: string; version: string };
};

const KEY = "lb_fav_v1";
const EVENT = "lb_fav_change";

function read(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as FavoriteItem[];
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

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

  const add = useCallback((item: FavoriteItem) => {
    const next = read();
    if (!next.some((i) => i.productSlug === item.productSlug)) {
      next.push(item);
      write(next);
    }
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((i) => i.productSlug !== slug));
  }, []);

  const toggle = useCallback((item: FavoriteItem) => {
    const next = read();
    const exists = next.some((i) => i.productSlug === item.productSlug);
    write(exists ? next.filter((i) => i.productSlug !== item.productSlug) : [...next, item]);
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, has, add, remove, toggle, clear, count: items.length };
}
