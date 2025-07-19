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
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import EmailConfirmationPage from "./components/auth/EmailConfirmationPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SafariScrollFix from "./components/SafariScrollFix";
import EmailVerificationBanner from "./components/EmailVerificationBanner";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load heavy components for better initial loading performance
const HomePage = lazy(() => import("./components/HomePage"));
const FishDetailPage = lazy(() => import("./components/FishDetailPage"));
const MenuPage = lazy(() => import("./components/MenuPage"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const WeatherPage = lazy(() => import("./components/WeatherPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const MyGearPage = lazy(() => import("./components/MyGearPage"));
const GearCategoryPage = lazy(() => import("./components/GearCategoryPage"));
const SideNav = lazy(() =>
  import("./components/BottomNav").then((module) => ({
    default: module.SideNav,
  })),
);
const WeatherWidgetPro = lazy(() => import("./components/WeatherWidgetPro"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));
const FAQPage = lazy(() => import("./components/FAQPage"));
const TermsPage = lazy(() => import("./components/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage"));
const BlobConnectionTest = lazy(
  () => import("./components/BlobConnectionTest"),
);
const BlobImageUploader = lazy(() => import("./components/BlobImageUploader"));
const BlobImageTest = lazy(() => import("./components/BlobImageTest"));
const AccountStatusChecker = lazy(
  () => import("./components/AccountStatusChecker"),
);
const StorageSetup = lazy(() => import("./components/StorageSetup"));
const DatabaseDebugger = lazy(() => import("./components/DatabaseDebugger"));
const ImageUploadDebugger = lazy(
  () => import("./components/ImageUploadDebugger"),
);
const GearDatabaseDebugger = lazy(
  () => import("./components/GearDatabaseDebugger"),
);
const WhatsNewPage = lazy(() => import("./components/WhatsNewPage"));

// Wrapper component to provide AuthContext within router
function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Create router with future flags
const router = createBrowserRouter(
  [
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
          path: "confirm-email",
          element: <EmailConfirmationPage />,
        },
        {
          path: "auth/confirm",
          element: <EmailConfirmationPage />,
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
              <FAQPage />
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
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

function AppContent() {
  // Check if we're on the splash page
  const location = useLocation();
  const navigate = useNavigate();
  const isSplashPage =
    location.pathname === "/" && !localStorage.getItem("userLocation");

  // Check if current route should have the weather widget in desktop layout
  const shouldShowWeatherWidget = ["/", "/search"].includes(location.pathname);

  // Check if we're on auth pages (login/signup) to hide sidebar
  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
    location.pathname,
  );

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
    <div className="w-full h-screen overflow-hidden">
      <SafariScrollFix />
      {/* Use flexbox layout for desktop */}
      <div className="mx-auto relative flex w-full h-full">
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
          className={`flex-1 max-w-full h-full flex flex-col overflow-hidden ${!isAuthPage ? "lg:ml-[var(--sidebar-width)]" : ""}`}
        >
          {/* Email verification banner - only show on non-auth pages */}
          {!isAuthPage && <EmailVerificationBanner />}

          <div className="w-full flex-1 overflow-y-auto pb-32 lg:pb-4">
            {/* Tempo routes - render before outlet to catch tempo routes first */}
            {import.meta.env.VITE_TEMPO && useRoutes(routes)}
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
          <div className="hidden lg:block lg:w-[380px] lg:flex-none h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="h-full overflow-y-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
