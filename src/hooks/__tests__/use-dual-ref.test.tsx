import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useDualRef } from "../use-dual-ref";

describe("useDualRef", () => {
  it("should return two refs and a setter function", () => {
    const { result } = renderHook(() => useDualRef<HTMLDivElement>());

    const [ref1, ref2, setRefs] = result.current;

    expect(ref1.current).toBeNull();
    expect(ref2.current).toBeNull();
    expect(typeof setRefs).toBe("function");
  });

  it("should set both refs to the same element", () => {
    const { result } = renderHook(() => useDualRef<HTMLDivElement>());
    const [ref1, ref2, setRefs] = result.current;

    const mockElement = document.createElement("div");
    setRefs(mockElement);

    expect(ref1.current).toBe(mockElement);
    expect(ref2.current).toBe(mockElement);
  });

  it("should clear both refs when set to null", () => {
    const { result } = renderHook(() => useDualRef<HTMLDivElement>());
    const [ref1, ref2, setRefs] = result.current;

    const mockElement = document.createElement("div");
    setRefs(mockElement);
    setRefs(null);

    expect(ref1.current).toBeNull();
    expect(ref2.current).toBeNull();
  });

  it("should maintain stable setter function across re-renders", () => {
    const { result, rerender } = renderHook(() => useDualRef<HTMLDivElement>());

    const initialSetter = result.current[2];

    rerender();

    const afterRerenderSetter = result.current[2];

    expect(initialSetter).toBe(afterRerenderSetter);
  });
});
