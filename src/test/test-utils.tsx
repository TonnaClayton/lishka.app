import React, { ReactElement, createContext, useContext } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock AuthContext
export const mockAuthContext = {
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
};

// Create a mock AuthContext for testing
const MockAuthContext = createContext<any>(mockAuthContext);

// Mock useAuth hook
export const useAuth = () => useContext(MockAuthContext);

// Create a mock AuthProvider component
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthContext.Provider value={mockAuthContext}>
      {children}
    </MockAuthContext.Provider>
  );
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MockAuthProvider>{children}</MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
