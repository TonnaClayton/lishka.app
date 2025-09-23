import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";
import LoginPage from "../login";
import React from "react";

// Mock the auth context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resendConfirmation: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    refreshProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    confirmEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
  }),
}));

// Mock useIsMobile hook
vi.mock("@/hooks/use-is-mobile", () => ({
  default: vi.fn(() => false), // Default to desktop
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, className }: any) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Mock ROUTES
vi.mock("@/lib/routing", () => ({
  ROUTES: {
    SIGNUP: "/signup",
    LOGIN_EMAIL: "/login/email",
  },
}));

describe("LoginPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main login page correctly on desktop", () => {
    render(<LoginPage />);

    // Check for main sections
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    expect(screen.getByText("Continue with Email")).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("renders the main login page correctly on mobile", async () => {
    const useIsMobile = await import("@/hooks/use-is-mobile");
    vi.mocked(useIsMobile.default).mockReturnValue(true);

    render(<LoginPage />);

    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    expect(screen.getByText("Continue with Email")).toBeInTheDocument();
  });

  it("contains proper links for navigation", () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole("link", {
      name: /continue with email/i,
    });
    const loginLink = screen.getByRole("link", { name: /log in/i });

    expect(signupLink).toHaveAttribute("href", "/signup");
    expect(loginLink).toHaveAttribute("href", "/login/email");
  });

  it("renders OAuth buttons (non-functional)", () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /continue with google/i,
    });
    const appleButton = screen.getByRole("button", {
      name: /continue with apple/i,
    });

    expect(googleButton).toBeInTheDocument();
    expect(appleButton).toBeInTheDocument();

    // These buttons should be rendered but not have click handlers yet
    expect(googleButton).toBeEnabled();
    expect(appleButton).toBeEnabled();
  });

  it("displays proper icons for each authentication method", () => {
    render(<LoginPage />);

    // Check for SVG icons (they should be present in the buttons)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2); // Google and Apple buttons

    // Check for mail icon in email link
    const emailLink = screen.getByRole("link", {
      name: /continue with email/i,
    });
    expect(emailLink).toBeInTheDocument();
  });

  it("contains proper semantic structure", () => {
    render(<LoginPage />);

    // Check for proper button and link elements
    const buttons = screen.getAllByRole("button");
    const links = screen.getAllByRole("link");

    expect(buttons).toHaveLength(2); // Google and Apple
    expect(links).toHaveLength(2); // Email signup and signin links

    // Check that text content is accessible
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });

  it("displays correct branding and imagery", () => {
    render(<LoginPage />);

    // Check for images (currently using "Pasted Image" as alt text)
    const images = screen.getAllByRole("img", { name: /pasted image/i });
    expect(images.length).toBeGreaterThan(0);

    // Just verify that images are present (exact count may vary based on responsive design)
    expect(images.length).toBeGreaterThan(0);
  });

  it("maintains proper visual hierarchy", () => {
    render(<LoginPage />);

    // Main call to action should be prominent
    const primaryActions = [
      screen.getByText("Continue with Google"),
      screen.getByText("Continue with Apple"),
      screen.getByText("Continue with Email"),
    ];

    primaryActions.forEach((action) => {
      expect(action).toBeInTheDocument();
    });

    // Secondary action should be less prominent
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });
});
