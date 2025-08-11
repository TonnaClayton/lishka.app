import { Suspense, useEffect, useState } from "react";
import {
  useLocation,
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useRoutes,
} from "react-router-dom";
import routes from "tempo-routes";
import { lazy } from "react";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  LoginPage,
  SignupPage,
  EmailConfirmationPage,
} from "./pages/auth";
import ProtectedRoute from "./components/auth/protected-route";
import SafariScrollFix from "./components/safari-scroll-fix";
import EmailVerificationBanner from "./components/email-verification-banner";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { config } from "@/lib/config";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { cn } from "./lib/utils";
import { useProfile } from "./hooks/queries";

// Lazy load heavy components for better initial loading performance
const HomePage = lazy(() => import("./pages/home"));
const FishDetailPage = lazy(() => import("./components/fish-detail-page"));
const MenuPage = lazy(() => import("./components/menu-page"));
const SearchPage = lazy(() => import("./pages/search"));
const WeatherPage = lazy(() => import("./components/weather-page"));
const ProfilePage = lazy(() => import("./pages/profile"));
const MyGearPage = lazy(() => import("./components/my-gear-page"));
const GearCategoryPage = lazy(() => import("./components/gear-category-page"));
const SideNav = lazy(() =>
  import("./components/bottom-nav").then((module) => ({
    default: module.SideNav,
  }))
);
const WeatherWidgetPro = lazy(() => import("./components/weather-widget-pro"));
const SettingsPage = lazy(() => import("./components/settings-page"));
const FaqPage = lazy(() => import("./components/faq-page"));
const TermsPage = lazy(() => import("./components/terms-page"));
const PrivacyPolicyPage = lazy(
  () => import("./components/privacy-policy-page")
);
const BlobConnectionTest = lazy(
  () => import("./components/blob-connection-test")
);
const BlobImageUploader = lazy(
  () => import("./components/blob-image-uploader")
);
const BlobImageTest = lazy(() => import("./components/blob-image-test"));
const AccountStatusChecker = lazy(
  () => import("./components/account-status-checker")
);
const StorageSetup = lazy(() => import("./components/storage-setup"));
const DatabaseDebugger = lazy(() => import("./components/database-debugger"));
const ImageUploadDebugger = lazy(
  () => import("./components/image-upload-debugger")
);
const GearDatabaseDebugger = lazy(
  () => import("./components/gear-database-debugger")
);
const WhatsNewPage = lazy(() => import("./components/whats-new-page"));

// Create router with future flags
const router = createBrowserRouter(
  [
    // Add tempo routes first if VITE_TEMPO is enabled
    ...(config.VITE_TEMPO ? routes : []),
    {
      path: "/",
      element: <AppWithAuth />,
      children: [
        // Public routes
        {
          path: "login",
          element: (
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "signup",
          element: (
            <ProtectedRoute requireAuth={false}>
              <SignupPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "forgot-password",
          element: (
            <ProtectedRoute requireAuth={false}>
              <ForgotPasswordPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "reset-password",
          element: (
            <ProtectedRoute requireAuth={true}>
              <ResetPasswordPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "confirm-email",
          element: (
            <ProtectedRoute requireAuth={false}>
              <EmailConfirmationPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "auth/confirm",
          element: (
            <ProtectedRoute requireAuth={false}>
              <EmailConfirmationPage />
            </ProtectedRoute>
          ),
        },
        // Protected routes
        {
          index: true,
          element: (
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "fish/:fishName",
          element: (
            <ProtectedRoute>
              <FishDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "fish/*",
          element: (
            <ProtectedRoute>
              <FishDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "menu",
          element: (
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "search",
          element: (
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "weather",
          element: (
            <ProtectedRoute>
              <WeatherPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "faq",
          element: (
            <ProtectedRoute>
              <FaqPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "terms",
          element: (
            <ProtectedRoute>
              <TermsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "privacy-policy",
          element: (
            <ProtectedRoute>
              <PrivacyPolicyPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "my-gear",
          element: (
            <ProtectedRoute>
              <MyGearPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "gear-category/:categoryId",
          element: (
            <ProtectedRoute>
              <GearCategoryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "blob-test",
          element: (
            <ProtectedRoute>
              <BlobConnectionTest />
            </ProtectedRoute>
          ),
        },
        {
          path: "blob-upload",
          element: (
            <ProtectedRoute>
              <BlobImageUploader />
            </ProtectedRoute>
          ),
        },
        {
          path: "account-status",
          element: (
            <ProtectedRoute requireAuth={false}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <AccountStatusChecker />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "storage-setup",
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <StorageSetup />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "blob-image-test",
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <BlobImageTest />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "database-debug",
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <DatabaseDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "image-upload-debug",
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <ImageUploadDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "gear-database-debug",
          element: (
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <GearDatabaseDebugger />
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: "whats-new",
          element: (
            <ProtectedRoute>
              <WhatsNewPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function AppContent() {
  // Check if we're on the splash page
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const isSplashPage = location.pathname === "/" && !profile?.location;

  // Check if current route should have the weather widget in desktop layout
  const shouldShowWeatherWidget = ["/", "/search"].includes(location.pathname);

  // Check if we're on auth pages (login/signup) to hide sidebar
  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);

  // Track if we're on mobile or desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Set initial sidebar width CSS variable and handle resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth >= 1024 ? "16rem" : "0";
      document.documentElement.style.setProperty("--sidebar-width", width);
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden">
      <SafariScrollFix />
      {/* Use flexbox layout for desktop */}
      <div className="flex w-full h-full">
        {/* Side Navigation - flex-none (fixed width) - hidden on auth pages */}
        {!isAuthPage && (
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
            !isAuthPage ? "lg:ml-[var(--sidebar-width)]" : ""
          )}
        >
          {/* Email verification banner - only show on non-auth pages */}
          {!isAuthPage && <EmailVerificationBanner />}

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
        {shouldShowWeatherWidget && (
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
      </div>
    </div>
  );
}

// Wrapper component to provide AuthContext within router
function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function App() {
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
    </QueryClientProvider>
  );
}

export default App;
