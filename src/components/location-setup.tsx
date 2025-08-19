import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MapPin, Navigation, Check } from "lucide-react";
import LoadingDots from "./loading-dots";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { log } from "@/lib/logging";
import { useUpdateProfile } from "@/hooks/queries";

interface LocationSetupProps {
  onLocationSet: (location: { lat: number; lng: number; name: string }) => void;
  isOverlay?: boolean;
  onClose?: () => void;
}

const LocationSetup = ({
  onLocationSet = () => {},
  isOverlay = false,
  onClose,
}: LocationSetupProps) => {
  const navigate = useNavigate();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [countdown, setCountdown] = useState<number | null>(null);
  const updateProfile = useUpdateProfile();

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let locationName = "Current Location";

          // Attempt to get location name via reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            );
            const data = await response.json();

            // Extract city/town and country from address details
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.hamlet ||
              "";
            const country = data.address?.country || "";

            // Format as "city, country"
            const name = [city, country].filter(Boolean).join(", ");

            // Check if location is on sea or water
            const isSeaLocation =
              !city || // No city means likely on water
              data.address?.sea ||
              data.address?.ocean ||
              data.address?.water ||
              data.address?.bay;

            if (isSeaLocation) {
              // For sea locations, display only coordinates
              const formattedLat = lat.toFixed(6);
              const formattedLng = lng.toFixed(6);
              locationName = `${formattedLat}, ${formattedLng}`;
            } else {
              locationName = name || "Current Location";
              log("Land location detected:", name, data.address);
            }
          } catch (error) {
            console.error("Error getting location name:", error);
          }

          const newLocation = {
            lat,
            lng,
            name: locationName,
          };
          setLocation(newLocation);
          setIsDetecting(false);

          // Start countdown
          setCountdown(4);

          // Set up countdown timer
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                handleContinue();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to retrieve your location. Please try selecting on the map.",
          );
          setIsDetecting(false);
        },
      );
    } else {
      alert(
        "Geolocation is not supported by your browser. Please try selecting on the map.",
      );
      setIsDetecting(false);
    }
  };

  const handleMapSelection = () => {
    setIsMapOpen(true);
  };

  const handleMapLocationSelect = (selectedLocation: {
    lat: number;
    lng: number;
    name: string;
    countryCode?: string;
  }) => {
    setLocation(selectedLocation);
    setIsMapOpen(false);
    // Start countdown
    setCountdown(4);

    // Set up countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => handleContinue(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    if (location) {
      // Also save the full location object for components that need coordinates
      const fullLocationData = {
        latitude: location.lat,
        longitude: location.lng,
        name:
          typeof location.name === "string"
            ? location.name.replace(/^"|"$/g, "")
            : location.name,
      };

      updateProfile.mutate({
        location_coordinates: fullLocationData,
        location: location.name,
      });

      // Call the onLocationSet callback with the location data
      onLocationSet(location);

      // Handle navigation or closing immediately
      if (!isOverlay) {
        navigate("/");
      } else if (onClose) {
        // If in overlay mode and onClose is provided, call it
        onClose();
      }
    }
  };

  return (
    <>
      {/* Map Selection Modal - Rendered as a separate modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative mx-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Select Your Location
                </h2>
                <button
                  onClick={() => {
                    setIsMapOpen(false);
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent border-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="w-full h-[500px]">
                <MapSelection
                  onLocationSelect={handleMapLocationSelect}
                  currentLocation={location}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-md mx-4 relative"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close icon removed */}
          <div className="w-full space-y-6 text-center">
            {/* Location Icon */}
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <MapPin className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Set Your Location
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto">
                We need your location to provide accurate fishing information
                for your area
              </p>
            </div>

            {/* Location Button */}
            <div className="space-y-4 pt-2">
              <Button
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-full flex items-center justify-center gap-2 transition-all duration-300 border-0 py-6"
              >
                {isDetecting ? (
                  <>
                    <LoadingDots color="#ffffff" size={5} />
                    <span className="ml-2 animate-pulse">
                      Detecting location...
                    </span>
                  </>
                ) : location ? (
                  <>
                    <Check className="h-5 w-5 text-white" />
                    <span>Location set to {location.name}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5" />
                    <span>Detect my location</span>
                  </>
                )}
              </Button>

              {/* Select on map link */}
              <button
                onClick={handleMapSelection}
                className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-0"
              >
                <Navigation className="h-4 w-4" />
                Select on map
              </button>
            </div>

            {/* Continue button */}
            {location && (
              <div className="mt-6">
                <Button
                  onClick={handleContinue}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-full flex items-center justify-center gap-2 transition-all duration-300 border-0 py-6"
                >
                  <Check className="h-5 w-5" />
                  <span>Continue with this location</span>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Fix Leaflet icon issue
// @ts-expect-error - Leaflet types are not compatible with TypeScript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Map Selection Component
interface MapSelectionProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  currentLocation?: { lat: number; lng: number; name: string } | null;
}

const MapSelection: React.FC<MapSelectionProps> = ({
  onLocationSelect,
  currentLocation = null,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null);
  const [locationName, setLocationName] = useState("");
  const [mapKey, setMapKey] = useState(0); // Force re-render on location change
  const defaultPosition: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [35.8997, 14.5146]; // Use current location if available, otherwise Malta as default

  // Set initial marker if we have a current location
  useEffect(() => {
    if (currentLocation) {
      setSelectedPosition([currentLocation.lat, currentLocation.lng]);
      setLocationName(currentLocation.name);
      // Force map re-render to prevent Leaflet position errors
      setMapKey((prev) => prev + 1);
    }
  }, [currentLocation]);

  // Function to handle map click and set marker
  const MapClickHandler = () => {
    try {
      useMapEvents({
        click: async (e) => {
          try {
            const { lat, lng } = e.latlng;
            setSelectedPosition([lat, lng]);

            // Generate a location name based on coordinates
            const formattedLat = lat.toFixed(6);
            const formattedLng = lng.toFixed(6);
            setLocationName(`${formattedLat}, ${formattedLng}`);
          } catch (error) {
            console.error("Error handling map click:", error);
          }
        },
      });
    } catch (error) {
      console.error("Error setting up map events:", error);
    }

    return null;
  };

  return (
    <div className="relative h-full flex flex-col gap-y-6 justify-center items-center">
      <MapContainer
        key={mapKey} // Force re-render to prevent Leaflet errors
        center={defaultPosition}
        zoom={currentLocation ? 15 : 13}
        style={{ height: "100%", width: "100%" }}
        className="flex"
        attributionControl={false}
        whenReady={() => {
          // Ensure map is properly initialized
          setTimeout(() => {
            try {
              window.dispatchEvent(new Event("resize"));
            } catch (error) {
              console.warn("Map resize event failed:", error);
            }
          }, 100);
        }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Standard Map" checked>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Marine Chart">
            <TileLayer
              attribution='&copy; <a href="https://openseamap.org">OpenSeaMap</a> contributors'
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <MapClickHandler />
        {selectedPosition && (
          <Marker
            key={`marker-${selectedPosition[0]}-${selectedPosition[1]}`}
            position={selectedPosition}
          />
        )}
      </MapContainer>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-[1000]">
        <Button
          onClick={() => {
            if (selectedPosition) {
              try {
                onLocationSelect({
                  lat: selectedPosition[0],
                  lng: selectedPosition[1],
                  name: locationName,
                });
              } catch (error) {
                console.error("Error selecting location:", error);
              }
            }
          }}
          disabled={!selectedPosition}
          className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 py-2 border-none shadow-md"
        >
          Select This Location
        </Button>
      </div>
    </div>
  );
};

export default LocationSetup;
