import { Suspense } from "react";
import {
  useLocation,
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./contexts/auth-context";
import { lazy } from "react";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  LoginPage,
  SignupPage,
  EmailConfirmationPage,
  LoginWithEmailPage,
} from "./pages/auth";
import AuthCallback from "./pages/auth/callback";
import ProtectedRoute from "./components/auth/protected-route";
import SafariScrollFix from "./components/safari-scroll-fix";
import { AuthProvider } from "./contexts/auth-context";
import { UploadProvider } from "./contexts/upload-context";
import { config } from "@/lib/config";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { cn } from "./lib/utils";
import { ROUTES } from "./lib/routing";
import ErrorBoundary from "./components/error-boundary";
import LandingPage from "./pages/landing";
import Page404 from "./pages/404";
import AuthWrapper from "./pages/auth/auth-wrapper";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";
import { initPosthog, posthog } from "./lib/posthog";
import { Toaster } from "./components/ui/toaster";
import AddToHomeScreenPrompt from "./components/add-to-homescreen";

// Lazy load heavy components for better initial loading performance
const HomePage = lazy(() => import("./pages/home"));
const FishDetailPage = lazy(() => import("./pages/fish-detail"));
const MenuPage = lazy(() => import("./pages/menu"));
const SearchPage = lazy(() => import("./pages/search"));
const WeatherPage = lazy(() => import("./pages/weather/weather"));
const ProfilePage = lazy(() => import("./pages/profile"));
const MyGearPage = lazy(() => import("./pages/gear/my-gear"));
const GearDetailPage = lazy(() => import("./pages/gear/gear-detail"));
const GearCategoryPage = lazy(() => import("./pages/gear/gear-category"));
const SideNav = lazy(() =>
  import("./components/bottom-nav").then((module) => ({
    default: module.SideNav,
  })),
);
const WeatherWidgetPro = lazy(() => import("./components/weather-widget-pro"));
const SettingsPage = lazy(() => import("./components/settings-page"));
const FaqPage = lazy(() => import("./components/faq-page"));
const TermsPage = lazy(() => import("./pages/terms"));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy"));
const BlobConnectionTest = lazy(
  () => import("./components/blob-connection-test"),
);
const BlobImageUploader = lazy(
  () => import("./components/blob-image-uploader"),
);
const BlobImageTest = lazy(() => import("./components/blob-image-test"));
const AccountStatusChecker = lazy(
  () => import("./components/account-status-checker"),
);
const StorageSetup = lazy(() => import("./components/storage-setup"));
const DatabaseDebugger = lazy(() => import("./components/database-debugger"));
const ImageUploadDebugger = lazy(
  () => import("./components/image-upload-debugger"),
);
const GearDatabaseDebugger = lazy(
  () => import("./components/gear-database-debugger"),
);
const WhatsNewPage = lazy(() => import("./components/whats-new-page"));
const GearUploadScreen = lazy(() => import("./components/gear-upload-screen"));

// Index page component that conditionally renders based on auth state
function IndexPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      {user ? <HomePage /> : <LandingPage />}
    </Suspense>
  );
}

// Content component that uses auth context
function AppContent() {
  // Check if we're on the splash page
  const { user } = useAuth();
  const location = useLocation();

  // Check if current route should have the weather widget in desktop layout
  const shouldShowWeatherWidget =
    location.pathname.includes("/search") || location.pathname == "/";

  // Check if we're on auth pages (login/signup) to hide sidebar
  const isAuthPage = [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.LOGIN_EMAIL,
    ROUTES.RESET_PASSWORD,
    "/home",
    ROUTES.PRIVACY_POLICY,
    ROUTES.TERMS,
  ].includes(location.pathname);

  const is404Page =
    Object.values(ROUTES).includes(location.pathname) == false &&
    location.pathname.includes("fish/") == false &&
    location.pathname.includes("gear-detail/") == false &&
    location.pathname.includes("gear-category/") == false &&
    location.pathname.includes("search/") == false;

  return (
    <>
      {!isAuthPage && !is404Page && user && (
        <Suspense
          fallback={
            <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800" />
          }
        >
          <SideNav />
        </Suspense>
      )}

      {/* Main content area - flex-auto (flexible width) */}
      <div
        className={cn(
          "flex-1 max-w-full h-full flex flex-col overflow-hidden",
          !isAuthPage && !is404Page && user
            ? "lg:ml-[var(--sidebar-width)]"
            : "",
        )}
      >
        {/* Email verification banner - only show on non-auth pages */}
        {/* {!isAuthPage && <EmailVerificationBanner />} */}

        <div className="w-full h-full flex-1">
          {/* Outlet for nested routes with suspense boundary */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading...
                  </p>
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>

      {/* Weather widget sidebar - flex-none (fixed width) */}
      {shouldShowWeatherWidget && user && (
        <div className="hidden lg:block lg:w-[380px] lg:flex-none bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-4 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            }
          >
            <WeatherWidgetPro />
          </Suspense>
        </div>
      )}
    </>
  );
}

// Wrapper component to provide AuthContext within router
function AppWithAuth() {
  return (
    <AuthProvider>
      <UploadProvider>
        <div className="w-full h-full overflow-hidden">
          <SafariScrollFix />
          {/* Use flexbox layout for desktop */}
          <div className="flex w-full h-full">
            <AppContent />
          </div>
        </div>
      </UploadProvider>
    </AuthProvider>
  );
}

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <UploadProvider>{children}</UploadProvider>
    </AuthProvider>
  );
};

// Conditionally import tempo routes - use empty array if not available
let tempoRoutes: any[] = [];
if (config.VITE_TEMPO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tempoRoutes = require("tempo-routes").default || [];
  } catch {
    // tempo-routes not available, continue with empty array
  }
}

// Create router with future flags
const router = createBrowserRouter(
  [
    // Add tempo routes first if VITE_TEMPO is enabled
    ...tempoRoutes,
    {
      path: "/home",
      element: (
        <AppWrapper>
          <LandingPage />
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.TERMS,
      element: (
        <AppWrapper>
          <TermsPage />
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.PRIVACY_POLICY,
      element: (
        <AppWrapper>
          <PrivacyPolicyPage />
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.LOGIN,
      element: (
        <AppWrapper>
          <ProtectedRoute requireAuth={false}>
            <LoginPage />
          </ProtectedRoute>
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.LOGIN_EMAIL,
      element: (
        <AppWrapper>
          <ProtectedRoute requireAuth={false}>
            <AuthWrapper>
              <LoginWithEmailPage />
            </AuthWrapper>
          </ProtectedRoute>
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.SIGNUP,
      element: (
        <AppWrapper>
          <ProtectedRoute requireAuth={false}>
            <AuthWrapper>
              <SignupPage />
            </AuthWrapper>
          </ProtectedRoute>
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.FORGOT_PASSWORD,
      element: (
        <AppWrapper>
          <ProtectedRoute requireAuth={false}>
            <AuthWrapper>
              <ForgotPasswordPage />
            </AuthWrapper>
          </ProtectedRoute>
        </AppWrapper>
      ),
    },
    {
      path: ROUTES.HOME,
      element: <AppWithAuth />,
      children: [
        // Public routes
        {
          index: true,
          element: <IndexPage />,
        },
        {
          path: ROUTES.RESET_PASSWORD,
          element: (
            <ProtectedRoute requireAuth={true}>
              <AuthWrapper>
                <ResetPasswordPage />
              </AuthWrapper>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.EMAIL_CONFIRMATION,
          element: (
            <ProtectedRoute requireAuth={false}>
              <AuthWrapper>
                <EmailConfirmationPage />
              </AuthWrapper>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.AUTH_CONFIRMATION,
          element: (
            <ProtectedRoute requireAuth={false}>
              <AuthWrapper>
                <EmailConfirmationPage />
              </AuthWrapper>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.AUTH_CALLBACK,
          element: (
            <ProtectedRoute requireAuth={false}>
              <AuthWrapper>
                <AuthCallback />
              </AuthWrapper>
            </ProtectedRoute>
          ),
        },

        {
          path: ROUTES.FISH_DETAIL,
          element: (
            <ProtectedRoute>
              <FishDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.FISH_DETAIL_WITH_ID,
          element: (
            <ProtectedRoute>
              <FishDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.MENU,
          element: (
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SEARCH,
          element: (
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "search/:id",
          element: (
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PROFILE,
          element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.WEATHER,
          element: (
            <ProtectedRoute>
              <WeatherPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SETTINGS,
          element: (
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.FAQ,
          element: (
            <ProtectedRoute>
              <FaqPage />
            </ProtectedRoute>
          ),
        },

        {
          path: ROUTES.MY_GEAR,
          element: (
            <ProtectedRoute>
              <MyGearPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.GEAR_DETAIL,
          element: (
            <ProtectedRoute>
              <GearDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SINGLE_GEAR_CATEGORY,
          element: (
            <ProtectedRoute>
              <GearCategoryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.BLOB_TEST,
          element: (
            <ProtectedRoute>
              <BlobConnectionTest />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.BLOB_UPLOAD,
          element: (
            <ProtectedRoute>
              <BlobImageUploader />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ACCOUNT_STATUS,
          element: (
            <ProtectedRoute requireAuth={false}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <AccountStatusChecker />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.STORAGE_SETUP,
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <StorageSetup />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.BLOB_IMAGE_TEST,
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <BlobImageTest />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.DATABASE_DEBUG,
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <DatabaseDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.IMAGE_UPLOAD_DEBUG,
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <ImageUploadDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.GEAR_DATABASE_DEBUG,
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <GearDatabaseDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "gear-upload",
          element: (
            <ProtectedRoute>
              <GearUploadScreen />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.WHATS_NEW,
          element: (
            <ProtectedRoute>
              <WhatsNewPage />
            </ProtectedRoute>
          ),
        },
        // Catch-all route for 404 errors
        {
          path: "*",
          element: <Page404 />,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);

function App() {
  initPosthog();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 1000,
      },
    },
  });

  return (
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <p>Loading...</p>
                </div>
              }
            >
              <RouterProvider router={router} />
            </Suspense>
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster />
            <AddToHomeScreenPrompt />
          </QueryClientProvider>
        </ErrorBoundary>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

export default App;
