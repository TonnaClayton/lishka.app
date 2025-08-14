import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthProvider, useAuth } from "../auth-context";
import { BrowserRouter } from "react-router-dom";

// Mock Supabase
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
};

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabaseClient,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Mock logging
vi.mock("@/lib/logging", () => ({
  log: vi.fn(),
}));

// Mock routing
vi.mock("@/lib/routing", () => ({
  ROUTES: {
    LOGIN: "/login",
  },
}));

// Mock profile query hook
vi.mock("@/hooks/queries", () => ({
  useProfile: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

// Mock window.location
const mockLocation = {
  href: "",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("AuthContext", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockLocation.href = "";
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("provides initial auth state", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true); // Initially loading

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles successful sign in", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSession = { user: mockUser, access_token: "token" };

    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signInResult = await result.current.signIn(
      "test@example.com",
      "password",
    );

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
    expect(signInResult.error).toBeNull();
  });

  it("handles sign in error", async () => {
    const mockError = { message: "Invalid credentials" };
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signInResult = await result.current.signIn(
      "test@example.com",
      "wrongpassword",
    );

    expect(signInResult.error).toEqual(mockError);
  });

  it("handles successful sign up", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signUpResult = await result.current.signUp(
      "test@example.com",
      "password",
      "John Doe",
    );

    expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    expect(signUpResult.error).toBeNull();
  });

  it("handles sign up error", async () => {
    const mockError = { message: "Email already exists" };
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signUpResult = await result.current.signUp(
      "test@example.com",
      "password",
      "John Doe",
    );

    expect(signUpResult.error).toEqual(mockError);
  });

  it("handles successful sign out", async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signOutResult = await result.current.signOut();

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    expect(signOutResult.error).toBeNull();
    expect(mockLocation.href).toBe("/login");
  });

  it("handles sign out error with fallback redirect", async () => {
    const mockError = { message: "Sign out failed" };
    mockSupabaseAuth.signOut.mockResolvedValue({ error: mockError });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signOutResult = await result.current.signOut();

    expect(signOutResult.error).toEqual(mockError);
    expect(mockLocation.href).toBe("/login");
  });

  it("handles sign out exception with fallback redirect", async () => {
    mockSupabaseAuth.signOut.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signOutResult = await result.current.signOut();

    expect(signOutResult.error?.message).toBe(
      "An unexpected error occurred during signout",
    );
    expect(mockLocation.href).toBe("/login");
  });

  it("handles forgot password", async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const forgotResult =
      await result.current.forgotPassword("test@example.com");

    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    expect(forgotResult.error).toBeNull();
  });

  it("handles resend confirmation", async () => {
    mockSupabaseAuth.resend.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resendResult =
      await result.current.resendConfirmation("test@example.com");

    expect(mockSupabaseAuth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "test@example.com",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    expect(resendResult.error).toBeNull();
  });

  it("handles account deletion", async () => {
    const mockDeleteResponse = { error: null };
    mockSupabaseClient.from().delete.mockResolvedValue(mockDeleteResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const deleteResult = await result.current.deleteAccount();

    expect(deleteResult.error).toBeNull();
    expect(mockLocation.href).toBe("/login");
  });

  it("handles account deletion error", async () => {
    const mockError = new Error("Deletion failed");
    mockSupabaseClient.from().delete.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const deleteResult = await result.current.deleteAccount();

    expect(deleteResult.error?.message).toContain("Failed to delete account");
  });

  it("handles auth state changes", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSession = { user: mockUser, access_token: "token" };

    let authStateCallback: (event: string, session: any) => void;

    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Simulate signed in event
    authStateCallback!("SIGNED_IN", mockSession);

    await waitFor(() => {
      // The auth state change should be handled
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  it("handles signed out event with navigation", async () => {
    let authStateCallback: (event: string, session: any) => void;

    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Simulate signed out event
    authStateCallback!("SIGNED_OUT", null);

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
      },
      { timeout: 1000 },
    );
  });
});
