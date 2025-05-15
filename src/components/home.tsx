import React, { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import LocationSetup from "./LocationSetup";
import HomePage from "./HomePage";
import { SideNav } from "./BottomNav";
import WeatherWidgetPro from "./WeatherWidgetPro";

// App flow states
enum AppState {
  SPLASH = "splash",
  LOCATION_SETUP = "location_setup",
  HOME = "home",
}

interface Location {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
}

const Home: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
  const [location, setLocation] = useState<Location | null>(null);

  // Check if location is already stored in localStorage on initial load
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setLocation(JSON.parse(savedLocation));
      setAppState(AppState.HOME);
    }
  }, []);

  // Handle splash screen continue button
  const handleSplashContinue = () => {
    setAppState(AppState.LOCATION_SETUP);
  };

  // Handle location setup completion
  const handleLocationSet = (newLocation: any) => {
    console.log("Location set with data:", newLocation);
    // Convert to Location format
    const locationObj: Location = {
      latitude: newLocation.lat,
      longitude: newLocation.lng,
      name: newLocation.name,
      countryCode: newLocation.countryCode || "es", // Default to Spanish for testing
    };
    setLocation(locationObj);
    localStorage.setItem("userLocation", JSON.stringify(locationObj));
    setAppState(AppState.HOME);
  };

  // Handle location change from home page
  const handleLocationChange = (newLocationName: string) => {
    if (location) {
      // Check if the location name is coordinates (for sea locations)
      const isCoordinates =
        newLocationName.includes(",") &&
        newLocationName.split(",").length === 2 &&
        !isNaN(parseFloat(newLocationName.split(",")[0].trim()));

      const updatedLocation = { ...location, name: newLocationName };
      setLocation(updatedLocation);
      localStorage.setItem("userLocation", JSON.stringify(updatedLocation));

      // Clear fish data cache when location changes
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("fish_data_")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  };

  // Render the appropriate component based on app state
  const renderContent = () => {
    switch (appState) {
      case AppState.SPLASH:
        return <SplashScreen onContinue={handleSplashContinue} />;
      case AppState.LOCATION_SETUP:
        return <LocationSetup onLocationSet={handleLocationSet} />;
      case AppState.HOME:
        return location ? (
          <div className="w-full flex flex-col lg:flex-row">
            <div className="flex-1 mx-auto max-w-full">
              <HomePage
                location={location.name}
                onLocationChange={handleLocationChange}
              />
            </div>
            {/* Desktop version of weather widget - positioned as third column */}
            <div className="hidden lg:block fixed right-0 top-0 w-80 h-screen border-l border-gray-200 dark:border-gray-800 bg-[#F7F7F7] dark:bg-gray-900">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">
                  Weather
                </h2>
                <div className="max-h-[calc(100vh-100px)] overflow-y-auto pb-4">
                  <WeatherWidgetPro userLocation={location} />
                </div>
              </div>
            </div>
            {/* Mobile version of weather widget */}
            <div className="lg:hidden mt-4 px-4 pb-20">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                Weather
              </h2>
              <WeatherWidgetPro userLocation={location} />
            </div>
          </div>
        ) : (
          <LocationSetup onLocationSet={handleLocationSet} />
        );
      default:
        return <SplashScreen onContinue={handleSplashContinue} />;
    }
  };

  return (
    <div className="h-screen bg-[#F7F7F7] dark:bg-gray-900 mx-auto flex">
      <div className="flex-1 lg:pl-64 lg:pr-80 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;
