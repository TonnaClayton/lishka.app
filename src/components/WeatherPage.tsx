import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { CheckCircle2, MapPin } from "lucide-react";
import WeatherWidget from "./WeatherWidgetPro";
import BottomNav from "./BottomNav";

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
      const savedLocation = localStorage.getItem("userLocationFull");
      if (!savedLocation) {
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
          if (parsedLocation) {
            const locationData: LocationData = {
              latitude:
                parsedLocation.latitude || parsedLocation.lat || 35.8997,
              longitude:
                parsedLocation.longitude || parsedLocation.lng || 14.5146,
              name: parsedLocation.name || "Malta",
            };
            setUserLocation(locationData);
            setLocation(locationData.name);
          }
        } catch (err) {
          console.error("Error parsing location:", err);
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
    window.addEventListener("storage", loadLocation);

    // Set data loaded after a short delay to simulate API fetch
    setTimeout(() => {
      setDataLoaded(true);
    }, 1000);

    return () => {
      window.removeEventListener("storage", loadLocation);
    };
  }, []);

  // Handle location update from the weather widget
  const handleLocationUpdate = (newLocation: LocationData) => {
    setUserLocation(newLocation);
    setLocation(newLocation.name);
    localStorage.setItem("userLocation", newLocation.name);
    localStorage.setItem("userLocationFull", JSON.stringify(newLocation));
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
          <img
            src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
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
