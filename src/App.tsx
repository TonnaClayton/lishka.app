import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import FishDetailPage from "./components/FishDetailPage";
import MenuPage from "./components/MenuPage";
import SearchPage from "./components/SearchPage";
import WeatherPage from "./components/WeatherPage";
import { SideNav } from "./components/BottomNav";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <div className="w-full dark:bg-gray-900">
        <div className="mx-auto">
          <SideNav />
          {/* Add Tempo routes before regular routes */}
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fish/:fishName" element={<FishDetailPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            {/* Add this to prevent conflicts with Tempo routes */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" />
            )}
          </Routes>
        </div>
      </div>
    </Suspense>
  );
}

export default App;
