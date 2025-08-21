import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.alert
  Object.defineProperty(window, "alert", {
    writable: true,
    value: vi.fn(),
  });

  // Mock window.location
  Object.defineProperty(window, "location", {
    value: {
      href: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  vi.restoreAllMocks();
});
