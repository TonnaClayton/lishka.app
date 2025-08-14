import { describe, expect, it } from "vitest";
import { ROUTES } from "../routing";

describe("ROUTES constants", () => {
  it("contains all expected route constants", () => {
    expect(ROUTES).toMatchObject({
      LOGIN: "/login",
      LOGIN_EMAIL: "/login/email",
      SIGNUP: "/signup",
      FORGOT_PASSWORD: "/forgot-password",
      RESET_PASSWORD: "/reset-password",
      EMAIL_CONFIRMATION: "/confirm-email",
      AUTH_CONFIRMATION: "/auth/confirm",
      HOME: "/",
      FISH: "/fish",
      FISH_DETAIL: "/fish/:fishName",
      FISH_DETAIL_WITH_ID: "/fish/*",
      SEARCH: "/search",
      MENU: "/menu",
      PROFILE: "/profile",
      SETTINGS: "/settings",
      WEATHER: "/weather",
      FAQ: "/faq",
      TERMS: "/terms",
      PRIVACY_POLICY: "/privacy-policy",
      MY_GEAR: "/my-gear",
      GEAR_CATEGORY: "/gear-category",
      SINGLE_GEAR_CATEGORY: "/gear-category/:categoryId",
      BLOB_TEST: "/blob-test",
      BLOB_UPLOAD: "/blob-upload",
      BLOB_IMAGE_TEST: "/blob-image-test",
      ACCOUNT_STATUS: "/account-status",
      STORAGE_SETUP: "/storage-setup",
      DATABASE_DEBUG: "/database-debug",
      IMAGE_UPLOAD_DEBUG: "/image-upload-debug",
      GEAR_DATABASE_DEBUG: "/gear-database-debug",
      WHATS_NEW: "/whats-new",
    });
  });

  it("has proper route structure for authentication routes", () => {
    expect(ROUTES.LOGIN).toBe("/login");
    expect(ROUTES.LOGIN_EMAIL).toBe("/login/email");
    expect(ROUTES.SIGNUP).toBe("/signup");
    expect(ROUTES.FORGOT_PASSWORD).toBe("/forgot-password");
    expect(ROUTES.RESET_PASSWORD).toBe("/reset-password");
  });

  it("has proper route structure for main app routes", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.PROFILE).toBe("/profile");
    expect(ROUTES.SETTINGS).toBe("/settings");
    expect(ROUTES.SEARCH).toBe("/search");
    expect(ROUTES.MENU).toBe("/menu");
    expect(ROUTES.WEATHER).toBe("/weather");
  });

  it("has proper route structure for fish-related routes", () => {
    expect(ROUTES.FISH).toBe("/fish");
    expect(ROUTES.FISH_DETAIL).toBe("/fish/:fishName");
    expect(ROUTES.FISH_DETAIL_WITH_ID).toBe("/fish/*");
  });

  it("has proper route structure for gear routes", () => {
    expect(ROUTES.MY_GEAR).toBe("/my-gear");
    expect(ROUTES.GEAR_CATEGORY).toBe("/gear-category");
    expect(ROUTES.SINGLE_GEAR_CATEGORY).toBe("/gear-category/:categoryId");
  });

  it("has proper route structure for confirmation routes", () => {
    expect(ROUTES.EMAIL_CONFIRMATION).toBe("/confirm-email");
    expect(ROUTES.AUTH_CONFIRMATION).toBe("/auth/confirm");
  });

  it("has proper route structure for legal/info routes", () => {
    expect(ROUTES.FAQ).toBe("/faq");
    expect(ROUTES.TERMS).toBe("/terms");
    expect(ROUTES.PRIVACY_POLICY).toBe("/privacy-policy");
    expect(ROUTES.WHATS_NEW).toBe("/whats-new");
  });

  it("has proper route structure for debug/test routes", () => {
    expect(ROUTES.BLOB_TEST).toBe("/blob-test");
    expect(ROUTES.BLOB_UPLOAD).toBe("/blob-upload");
    expect(ROUTES.BLOB_IMAGE_TEST).toBe("/blob-image-test");
    expect(ROUTES.ACCOUNT_STATUS).toBe("/account-status");
    expect(ROUTES.STORAGE_SETUP).toBe("/storage-setup");
    expect(ROUTES.DATABASE_DEBUG).toBe("/database-debug");
    expect(ROUTES.IMAGE_UPLOAD_DEBUG).toBe("/image-upload-debug");
    expect(ROUTES.GEAR_DATABASE_DEBUG).toBe("/gear-database-debug");
  });

  it("ensures no routes have trailing slashes (except root)", () => {
    Object.entries(ROUTES).forEach(([key, route]) => {
      if (route !== "/") {
        expect(route).not.toMatch(/\/$/);
      }
    });
  });

  it("ensures parameterized routes use correct syntax", () => {
    expect(ROUTES.FISH_DETAIL).toMatch(/:fishName/);
    expect(ROUTES.SINGLE_GEAR_CATEGORY).toMatch(/:categoryId/);
  });

  it("ensures wildcard routes use correct syntax", () => {
    expect(ROUTES.FISH_DETAIL_WITH_ID).toMatch(/\/\*$/);
  });

  it("has unique route values", () => {
    const routeValues = Object.values(ROUTES);
    const uniqueRoutes = [...new Set(routeValues)];
    expect(routeValues).toHaveLength(uniqueRoutes.length);
  });

  it("uses consistent naming conventions", () => {
    Object.keys(ROUTES).forEach((key) => {
      // All keys should be uppercase with underscores
      expect(key).toMatch(/^[A-Z_]+$/);
    });

    Object.values(ROUTES).forEach((route) => {
      // All routes should start with /
      expect(route).toMatch(/^\//);
      // Routes should use kebab-case (lowercase with hyphens) except for parameters
      if (!route.includes(":") && !route.includes("*")) {
        expect(route).toMatch(/^\/[a-z-/]*$/);
      }
    });
  });
});
