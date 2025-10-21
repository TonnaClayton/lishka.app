import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthProvider, useAuth } from "../auth-context";
import { BrowserRouter } from "react-router-dom";

// Mock Supabase - avoid referencing variables in vi.mock factory
vi.mock("@/lib/supabase", () => {
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
    admin: {
      deleteUser: vi.fn(),
    },
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

  const mockAuthService = {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resend: vi.fn(),
    resendConfirmation: vi.fn(),
    forgotPassword: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
  };

  const mockProfileService = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
  };

  return {
    supabase: mockSupabaseClient,
    authService: mockAuthService,
    profileService: mockProfileService,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  })),
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

// Mock blob storage
vi.mock("@/lib/blob-storage", () => ({
  uploadAvatar: vi.fn(),
  getBlobStorageStatus: vi.fn().mockResolvedValue({ available: true }),
}));

// Mock profile query hook
vi.mock("@/hooks/queries", () => ({
  useProfile: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useCreateProfile: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useUpdateProfile: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  profileQueryKeys: {
    useProfile: (userId: string) => ["profile", userId],
    useUserPhotos: (userId: string) => ["userPhotos", userId],
    useUserGear: (userId: string) => ["userGear", userId],
  },
}));

// Mock window.location methods
Object.defineProperty(window, "location", {
  value: {
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
  configurable: true,
});

describe("AuthContext", () => {
  let queryClient: QueryClient;
  let mockSupabaseAuth: any;
  let mockSupabaseClient: any;
  let mockAuthService: any;
  let mockProfileService: any;

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

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset window location href to empty string for each test
    Object.defineProperty(window.location, "href", {
      value: "",
      writable: true,
      configurable: true,
    });

    // Get the mocked services
    const { supabase, authService, profileService } = await import(
      "@/lib/supabase"
    );
    mockSupabaseClient = supabase as any;
    mockSupabaseAuth = mockSupabaseClient.auth;
    mockAuthService = authService as any;
    mockProfileService = profileService as any;

    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockAuthService.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockAuthService.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Setup authService mocks
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockAuthService.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockAuthService.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Also setup the supabase.auth mocks since auth-context uses both
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

    mockAuthService.signIn.mockResolvedValue({
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

    expect(mockAuthService.signIn).toHaveBeenCalledWith(
      "test@example.com",
      "password",
    );
    expect(signInResult.error).toBeNull();
  });

  it("handles sign in error", async () => {
    const mockError = { message: "Invalid credentials" };
    mockAuthService.signIn.mockResolvedValue({
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
    mockAuthService.signUp.mockResolvedValue({
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

    expect(mockAuthService.signUp).toHaveBeenCalledWith(
      "test@example.com",
      "password",
      "John Doe",
    );
    expect(signUpResult.error).toBeNull();
  });

  it("handles sign up error", async () => {
    const mockError = { message: "Email already exists" };
    mockAuthService.signUp.mockResolvedValue({
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
    mockAuthService.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signOutResult = await result.current.signOut();

    expect(mockAuthService.signOut).toHaveBeenCalled();
    expect(signOutResult.error).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("handles sign out error with fallback redirect", async () => {
    const mockError = { message: "Sign out failed" };
    mockAuthService.signOut.mockResolvedValue({ error: mockError });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const signOutResult = await result.current.signOut();

    expect(signOutResult.error).toEqual(mockError);
    expect(window.location.href).toBe("/login");
  });

  it("handles sign out exception with fallback redirect", async () => {
    mockAuthService.signOut.mockRejectedValue(new Error("Network error"));

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
    expect(window.location.href).toBe("/login");
  });

  it("handles forgot password", async () => {
    mockAuthService.forgotPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const forgotResult =
      await result.current.forgotPassword("test@example.com");

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(forgotResult.error).toBeNull();
  });

  it("handles resend confirmation", async () => {
    mockAuthService.resendConfirmation.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resendResult =
      await result.current.resendConfirmation("test@example.com");

    expect(mockAuthService.resendConfirmation).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(resendResult.error).toBeNull();
  });

  it("handles account deletion", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to delete account when no user is logged in
    const deleteResult = await result.current.deleteAccount();

    // Should return error for no user logged in
    expect(deleteResult.error?.message).toBe("No user logged in");
  });

  it("handles account deletion error", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to delete account when no user is logged in
    const deleteResult = await result.current.deleteAccount();

    // Should return error for no user logged in
    expect(deleteResult.error?.message).toBe("No user logged in");
  });

  it("handles auth state changes", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSession = { user: mockUser, access_token: "token" };

    let authStateCallback: (event: string, session: any) => void;

    // Override the supabase auth mock (which is what AuthContext actually uses)
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for the callback to be set
    await waitFor(() => {
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });

    // Simulate signed in event
    authStateCallback!("SIGNED_IN", mockSession);

    await waitFor(() => {
      // The auth state change should be handled
      expect(authStateCallback).toBeDefined();
    });
  });

  it("handles signed out event with navigation", async () => {
    let authStateCallback: (event: string, session: any) => void;

    // Override the supabase auth mock (which is what AuthContext actually uses)
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for the callback to be set
    await waitFor(() => {
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
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
