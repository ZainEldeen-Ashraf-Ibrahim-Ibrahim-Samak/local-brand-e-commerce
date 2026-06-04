import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCompare, COMPARE_MAX, type CompareItem } from "@/lib/compare/useCompare";

const item = (slug: string): CompareItem => ({
  productSlug: slug,
  name: { en: slug, ar: slug },
  basePrice: 1000,
});

describe("useCompare (FR-015/FR-016/FR-020)", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds items up to the max of 3", () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.add(item("a"));
      result.current.add(item("b"));
      result.current.add(item("c"));
    });
    expect(result.current.count).toBe(COMPARE_MAX);
    expect(result.current.isFull).toBe(true);
  });

  it("rejects a 4th item and returns false", () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.add(item("a"));
      result.current.add(item("b"));
      result.current.add(item("c"));
    });
    let added: boolean | undefined;
    act(() => {
      added = result.current.add(item("d"));
    });
    expect(added).toBe(false);
    expect(result.current.count).toBe(3);
  });

  it("removes an item, freeing a slot", () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.add(item("a"));
      result.current.add(item("b"));
      result.current.add(item("c"));
    });
    act(() => result.current.remove("b"));
    expect(result.current.count).toBe(2);
    expect(result.current.isFull).toBe(false);
    let added: boolean | undefined;
    act(() => {
      added = result.current.add(item("d"));
    });
    expect(added).toBe(true);
  });
});
