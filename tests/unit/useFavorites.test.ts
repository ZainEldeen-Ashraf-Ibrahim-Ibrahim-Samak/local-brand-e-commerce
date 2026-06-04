import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFavorites, type FavoriteItem } from "@/lib/favorites/useFavorites";

const item = (slug: string): FavoriteItem => ({
  productSlug: slug,
  name: { en: slug, ar: slug },
  basePrice: 1000,
});

describe("useFavorites (FR-013/FR-020)", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds, reflects, and persists a favorite", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(item("a")));
    expect(result.current.count).toBe(1);
    expect(result.current.has("a")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem("lb_fav_v1")!)).toHaveLength(1);
  });

  it("does not add duplicates", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(item("a")));
    act(() => result.current.add(item("a")));
    expect(result.current.count).toBe(1);
  });

  it("toggles a favorite off and on", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(item("a")));
    expect(result.current.has("a")).toBe(true);
    act(() => result.current.toggle(item("a")));
    expect(result.current.has("a")).toBe(false);
  });

  it("removes a favorite", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(item("a")));
    act(() => result.current.remove("a"));
    expect(result.current.count).toBe(0);
  });
});
