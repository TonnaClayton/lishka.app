import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/test/test-utils";
import LoginPage from "../login";
import React from "react";

// Mock useIsMobile hook
vi.mock("@/hooks/use-is-mobile", () => ({
  default: vi.fn(() => false),
}));

// Mock ROUTES
vi.mock("@/lib/routing", () => ({
  ROUTES: {
    SIGNUP: "/signup",
    LOGIN_EMAIL: "/login/email",
  },
}));

describe("LoginPage - Basic UI Tests", () => {
  it("renders authentication options", () => {
    render(<LoginPage />);

    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    expect(screen.getByText("Continue with Email")).toBeInTheDocument();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders brand messaging", () => {
    render(<LoginPage />);

    expect(screen.getByText("Your AI Fishing Companion")).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });

  it("contains proper navigation links", () => {
    render(<LoginPage />);

    const emailLink = screen.getByRole("link", {
      name: /continue with email/i,
    });
    const signinLink = screen.getByRole("link", { name: /sign in/i });

    expect(emailLink).toHaveAttribute("href", "/signup");
    expect(signinLink).toHaveAttribute("href", "/login/email");
  });
});
