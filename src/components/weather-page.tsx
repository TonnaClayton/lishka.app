import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { CheckCircle2, MapPin } from "lucide-react";
import WeatherWidget from "./weather-widget-pro";
import BottomNav from "./bottom-nav";
import { log } from "@/lib/logging";

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

const WeatherPage: React.FC = () => {
  const [location, setLocation] = useState<string>("Malta");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // Set a coastal location for better marine data if none exists
  useEffect(() => {
    const loadLocation = () => {
      log("[WeatherPage] Loading location from localStorage");
      const savedLocation = localStorage.getItem("userLocationFull");

      if (!savedLocation) {
        log("[WeatherPage] No saved location, setting default Malta");
        // Malta coordinates as a good default for marine data
        const coastalLocation = {
          latitude: 35.8997,
          longitude: 14.5146,
          name: "Malta",
        };
        localStorage.setItem("userLocation", coastalLocation.name);
        localStorage.setItem(
          "userLocationFull",
          JSON.stringify(coastalLocation),
        );
        setUserLocation(coastalLocation);
        setLocation(coastalLocation.name);
      } else {
        try {
          const parsedLocation = JSON.parse(savedLocation);
          log(
            "[WeatherPage] Parsed location from localStorage:",
            parsedLocation,
          );

          if (parsedLocation) {
            const locationData: LocationData = {
              latitude:
                parsedLocation.latitude || parsedLocation.lat || 35.8997,
              longitude:
                parsedLocation.longitude || parsedLocation.lng || 14.5146,
              name: parsedLocation.name || "Malta",
            };
            log("[WeatherPage] Setting location to:", locationData);
            setUserLocation(locationData);
            setLocation(locationData.name);
          }
        } catch (err) {
          console.error("[WeatherPage] Error parsing location:", err);
          // Fallback to default location
          const coastalLocation = {
            latitude: 35.8997,
            longitude: 14.5146,
            name: "Malta",
          };
          setUserLocation(coastalLocation);
          setLocation(coastalLocation.name);
        }
      }
    };

    // Load location initially
    loadLocation();

    // Listen for storage changes from other components
    const handleStorageChange = (event?: StorageEvent) => {
      if (
        !event ||
        event.key === "userLocation" ||
        event.key === "userLocationFull"
      ) {
        log(
          "[WeatherPage] Storage change detected, reloading location",
          event?.key,
        );
        loadLocation();
      }
    };

    const handleLocationChangeEvent = (event: CustomEvent) => {
      log("[WeatherPage] Location change event received", event.detail);
      loadLocation();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "locationChanged",
      handleLocationChangeEvent as EventListener,
    );

    // Set data loaded after a short delay to simulate API fetch
    setTimeout(() => {
      setDataLoaded(true);
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "locationChanged",
        handleLocationChangeEvent as EventListener,
      );
    };
  }, []);

  // Handle location update from the weather widget
  const handleLocationUpdate = (newLocation: LocationData) => {
    log("[WeatherPage] Location updated to:", newLocation);
    setUserLocation(newLocation);
    setLocation(newLocation.name);

    try {
      localStorage.setItem("userLocation", newLocation.name);
      localStorage.setItem("userLocationFull", JSON.stringify(newLocation));
      log("[WeatherPage] Saved location to localStorage:", newLocation);
    } catch (error) {
      console.error("[WeatherPage] Error saving location:", error);
    }

    // Dispatch events to notify other components
    setTimeout(() => {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(
        new CustomEvent("locationChanged", { detail: newLocation }),
      );
      log("[WeatherPage] Events dispatched for location change");
    }, 100);

    // Force data reload when location changes
    setDataLoaded(false);
    setTimeout(() => {
      setDataLoaded(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-background max-w-full overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full lg:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-dark.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto hidden dark:block"
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold dark:text-white">Weather</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 lg:max-w-3xl lg:mx-auto pb-20 w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1 dark:text-white lg:text-3xl">
            {location} Weather
          </h1>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-blue-500 mr-1" />
            <p className="text-sm text-muted-foreground dark:text-gray-300 lg:text-base">
              Marine conditions for fishing
            </p>
          </div>
        </div>

        <WeatherWidget
          userLocation={userLocation}
          onLocationUpdate={handleLocationUpdate}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default WeatherPage;
