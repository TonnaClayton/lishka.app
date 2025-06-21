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
import HomePage from "./components/HomePage";
import FishDetailPage from "./components/FishDetailPage";
import MenuPage from "./components/MenuPage";
import SearchPage from "./components/SearchPage";
import WeatherPage from "./components/WeatherPage";
import ProfilePage from "./components/ProfilePage";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import EmailConfirmationPage from "./components/auth/EmailConfirmationPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { SideNav } from "./components/BottomNav";
import WeatherWidgetPro from "./components/WeatherWidgetPro";
import SettingsPage from "./components/SettingsPage";
import BlobConnectionTest from "./components/BlobConnectionTest";
import BlobImageUploader from "./components/BlobImageUploader";
import BlobImageTest from "./components/BlobImageTest";
import AccountStatusChecker from "./components/AccountStatusChecker";
import StorageSetup from "./components/StorageSetup";
import DatabaseDebugger from "./components/DatabaseDebugger";
import ImageUploadDebugger from "./components/ImageUploadDebugger";
import SafariScrollFix from "./components/SafariScrollFix";
import EmailVerificationBanner from "./components/EmailVerificationBanner";
import { AuthProvider } from "./contexts/AuthContext";

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
        {!isAuthPage && <SideNav />}

        {/* Main content area - flex-auto (flexible width) */}
        <div
          className={`flex-1 max-w-full h-full flex flex-col overflow-hidden ${!isAuthPage ? "lg:ml-[var(--sidebar-width)]" : ""}`}
        >
          {/* Email verification banner - only show on non-auth pages */}
          {!isAuthPage && <EmailVerificationBanner />}

          <div className="w-full flex-1 overflow-y-auto pb-32 lg:pb-4">
            {/* Tempo routes - render before outlet to catch tempo routes first */}
            {import.meta.env.VITE_TEMPO && useRoutes(routes)}
            {/* Outlet for nested routes */}
            <Outlet />
          </div>
        </div>

        {/* Weather widget sidebar - flex-none (fixed width) */}
        {shouldShowWeatherWidget && (
          <div className="hidden lg:block lg:w-[380px] lg:flex-none h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <WeatherWidgetPro />
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
