import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./components/HomePage";
import FishDetailPage from "./components/FishDetailPage";
import MenuPage from "./components/MenuPage";
import SearchPage from "./components/SearchPage";
import WeatherPage from "./components/WeatherPage";
import { SideNav } from "./components/BottomNav";
import WeatherWidgetPro from "./components/WeatherWidgetPro";
import routes from "tempo-routes";
import SettingsPage from "./components/SettingsPage";
import BlobConnectionTest from "./components/BlobConnectionTest";
import BlobImageUploader from "./components/BlobImageUploader";
// Removed SupabaseConnectionTest import

function App() {
  // Check if we're on the splash page
  const location = useLocation();
  const isSplashPage =
    location.pathname === "/" && !localStorage.getItem("userLocation");

  // Check if current route should have the weather widget in desktop layout
  const shouldShowWeatherWidget = ["/", "/search"].includes(location.pathname);

  // Set initial sidebar width CSS variable and handle resize
  useEffect(() => {
    const setSidebarWidth = () => {
      const width = window.innerWidth >= 1024 ? "16rem" : "0";
      document.documentElement.style.setProperty("--sidebar-width", width);
    };

    setSidebarWidth();
    window.addEventListener("resize", setSidebarWidth);

    return () => window.removeEventListener("resize", setSidebarWidth);
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <div className="w-full">
        {/* Use flexbox layout for desktop */}
        <div className="mx-auto relative flex w-full min-h-screen">
          {/* Side Navigation - flex-none (fixed width) */}
          {!isSplashPage && <SideNav />}

          {/* Main content area - flex-auto (flexible width) */}
          <div
            className="flex-1 pb-20 lg:pb-0 max-w-full overflow-hidden"
            style={{ marginLeft: "var(--sidebar-width)" }}
          >
            <div className="w-full p-0 sm:p-4 pb-20 lg:pb-0">
              {/* Add Tempo routes before regular routes */}
              {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/fish/:fishName" element={<FishDetailPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/blob-test" element={<BlobConnectionTest />} />
                <Route path="/blob-upload" element={<BlobImageUploader />} />
                {/* Add this to prevent conflicts with Tempo routes */}
                {import.meta.env.VITE_TEMPO === "true" && (
                  <Route path="/tempobook/*" />
                )}
              </Routes>
            </div>
          </div>

          {/* Weather widget sidebar - flex-none (fixed width) */}
          {shouldShowWeatherWidget && (
            <div className="hidden lg:block lg:w-[380px] lg:flex-none lg:overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
              <div className="h-full flex flex-col">
                <WeatherWidgetPro />
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}

export default App;
