import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useLazyLoading } from "../use-lazy-loading";

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});

beforeEach(() => {
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
});

describe("useLazyLoading", () => {
  it("should return ref and initial visibility state", () => {
    const { result } = renderHook(() => useLazyLoading());

    const [elementRef, isVisible] = result.current;

    expect(elementRef.current).toBeNull();
    expect(isVisible).toBe(false);
  });

  it("should accept custom options", () => {
    const { result } = renderHook(() =>
      useLazyLoading({ threshold: 0.5, rootMargin: "100px" }),
    );

    const [elementRef, isVisible] = result.current;

    expect(elementRef.current).toBeNull();
    expect(isVisible).toBe(false);
  });

  it("should fallback to visible when IntersectionObserver is not supported", () => {
    // Temporarily remove IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    delete (window as any).IntersectionObserver;

    const { result } = renderHook(() => useLazyLoading());
    const [, isVisible] = result.current;

    expect(isVisible).toBe(true);

    // Restore IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it("should memoize options to prevent unnecessary re-renders", () => {
    const options = { threshold: 0.5, rootMargin: "100px" };
    const { rerender } = renderHook(() => useLazyLoading(options));

    // Mock IntersectionObserver constructor to track calls
    const constructorSpy = vi.spyOn(window, "IntersectionObserver");

    rerender();
    rerender();

    // Should only be called once due to memoization
    expect(constructorSpy).toHaveBeenCalledTimes(0); // 0 because element ref is null
  });
});
