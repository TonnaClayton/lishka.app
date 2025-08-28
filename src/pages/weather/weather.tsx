import React, { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import WeatherWidget from "@/components/weather-widget-pro";
import BottomNav from "@/components/bottom-nav";
import { log } from "@/lib/logging";
import { useAuth } from "@/contexts/auth-context";
import { useUserLocation } from "@/hooks/queries";
import { DEFAULT_LOCATION } from "@/lib/const";
import { Button } from "@/components/ui/button";
import LocationModal from "@/components/location-modal";

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

const WeatherPage: React.FC = () => {
  const { profile } = useAuth();
  const [location, setLocation] = useState<string>(
    profile.location || DEFAULT_LOCATION.name,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataLoaded, setDataLoaded] = useState(false);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const openLocationModal = useMemo(() => {
    if (profile == undefined) {
      return false;
    }

    const needsLocationAfterOnboarding =
      (profile?.location == "" || profile?.location == null) &&
      profile?.has_seen_onboarding_flow === true;

    if (isLocationModalOpen || needsLocationAfterOnboarding) {
      return true;
    }

    return false;
  }, [profile, isLocationModalOpen]);

  const { updateLocation } = useUserLocation();

  // Handle location update from the weather widget
  const handleLocationUpdate = (newLocation: LocationData) => {
    log("[WeatherPage] Location updated to:", newLocation);

    setLocation(newLocation.name);

    try {
      updateLocation({
        name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
      log("[WeatherPage] Saved location to database:", newLocation);
    } catch (error) {
      console.error("[WeatherPage] Error saving location:", error);
    }

    setDataLoaded(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7] max-w-full overflow-hidden">
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
          <div className="flex items-center gap-2">
            {/* Location Information */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-lishka-blue dark:text-lishka-blue hover:text-lishka-blue dark:hover:text-lishka-blue p-1 h-auto"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <span className="text-sm truncate">{location}</span>
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className=" p-4 lg:p-6 lg:max-w-3xl lg:mx-auto pb-20 w-full">
          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-1 text-[#191B1F] lg:text-3xl">
              {location} Weather
            </h1>
            <p className="text-sm text-[#65758B] dark:text-gray-300 lg:text-base">
              Marine conditions for fishing
            </p>
          </div>

          <WeatherWidget
            hideLocation={true}
            userLocation={{
              latitude: (profile.location_coordinates as any)
                .latitude as number,
              longitude: (profile.location_coordinates as any)
                .longitude as number,
              name: profile.location,
            }}
            onLocationUpdate={handleLocationUpdate}
            className="px-0 lg:px-0"
          />
        </div>
      </div>

      <LocationModal
        isOpen={openLocationModal}
        onClose={() => {
          if (profile?.location != "" && profile?.location != null) {
            setIsLocationModalOpen(false);
          }
        }}
        onLocationSelect={() => {
          //onLocationChange(newLocation.name);
        }}
        currentLocation={(() => {
          const locationCoordinates = profile?.location_coordinates as any;

          return locationCoordinates
            ? {
                latitude: locationCoordinates.latitude as number | undefined,
                longitude: locationCoordinates.longitude as number | undefined,
                name: profile.location,
              }
            : null;
        })()}
        title="Set Your Location"
      />

      <BottomNav />
    </div>
  );
};

export default WeatherPage;
