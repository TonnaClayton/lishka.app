import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
// import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  MapContainer,
  TileLayer,
  Marker,
  // useMapEvents,
  LayersControl,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { log, error as logError } from "@/lib/logging";
import { useUserLocation } from "@/hooks/queries";
import { DEFAULT_LOCATION } from "@/lib/const";
import useDeviceSize from "@/hooks/use-device-size";
import { cn } from "@/lib/utils";

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
  state?: string;
  city?: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData | null;
  title?: string;
  trigger?: React.ReactNode;
}

interface AlertState {
  show: boolean;
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

// Fix Leaflet icon issue with proper CDN URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Map Selection Component
const MapSelection = ({
  currentLocation,
}: {
  onLocationSelect: (location: LocationData) => void;
  currentLocation: LocationData;
}) => {
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null);
  const [locationName, setLocationName] = useState("");
  const [map, setMap] = useState<L.Map | null>(null);
  const [isSeaLocation, setIsSeaLocation] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Make selectedPosition and locationName available to parent component
  React.useEffect(() => {
    // Store these values in window for the parent component to access
    (window as any).mapSelectionState = {
      selectedPosition,
      locationName,
      isSeaLocation,
    };
  }, [selectedPosition, locationName, isSeaLocation]);

  // Set initial marker and center map only once when component mounts
  useEffect(() => {
    if (currentLocation && map && !hasInitialized) {
      const lat = currentLocation.latitude;
      const lng = currentLocation.longitude;
      if (lat && lng) {
        setSelectedPosition([lat, lng]);
        setLocationName(currentLocation.name);
        log(
          `Initial centering map on: ${lat}, ${lng} (${currentLocation.name})`,
        );
        map.setView([lat, lng], 15);
        setHasInitialized(true);
      }
    }
  }, [currentLocation, map, hasInitialized]);

  // Function to handle map click and set marker
  const MapClickHandler = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const map = useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);

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

          log("Location data:", {
            isSeaLocation,
            city,
            country,
            address: data.address,
            lat,
            lng,
          });

          setIsSeaLocation(isSeaLocation);

          // if (isSeaLocation) {
          //   // For sea locations, display only coordinates
          //   const formattedLat = lat.toFixed(6);
          //   const formattedLng = lng.toFixed(6);
          //   setLocationName(`${formattedLat}, ${formattedLng}`);
          // } else {

          // }
          setLocationName(name);
        } catch (error) {
          logError("Error getting location name:", error);
          // Display coordinates as fallback
          const formattedLat = lat.toFixed(6);
          const formattedLng = lng.toFixed(6);
          setLocationName(`${formattedLat}, ${formattedLng}`);
        }
      },
    });
    return null;
  };

  return (
    <div className="relative h-full flex flex-col gap-y-6 justify-center items-center">
      <MapContainer
        center={
          [
            currentLocation?.latitude,
            currentLocation?.longitude,
          ] as L.LatLngTuple
        }
        // Zoom in closer if we have a current location
        zoom={currentLocation ? 15 : 13}
        style={{ height: "100%", width: "100%" }}
        className="flex"
        ref={setMap}
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
        {selectedPosition && <Marker position={selectedPosition} />}
      </MapContainer>
    </div>
  );
};

const LocationModal = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation = null,
  title = "Update Your Location",
  trigger,
}: LocationModalProps) => {
  const [loading, setLoading] = useState(false);
  const { updateLocationAsync } = useUserLocation();
  const { height } = useDeviceSize();
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
    variant: "default",
  });

  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default",
  ) => {
    setAlert({ show: true, title, description, variant });
    setTimeout(() => {
      setAlert({ show: false, title: "", description: "", variant: "default" });
    }, 5000);
  };

  const handleLocationUpdate = async (newLocation: LocationData) => {
    //startTransition(async () => {
    log("[LocationModal] Updating location:", newLocation);

    // Clean the location name
    const cleanName =
      typeof newLocation.name === "string"
        ? newLocation.name.replace(/^"|"$/g, "")
        : newLocation.name;

    // Create the full location data object
    const fullLocationData = {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      name: cleanName,
    };

    try {
      setLoading(true);
      await updateLocationAsync({
        name: cleanName,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        countryCode: newLocation.countryCode,
        state: newLocation.state,
        city: newLocation.city,
      });
    } catch (error) {
      logError("[LocationModal] Error saving to database:", error);
    }

    setLoading(false);
    // Call the onLocationSelect callback with the location data
    onLocationSelect(fullLocationData);

    // Close the modal
    onClose();
    // });
  };

  const handleDetectLocation = async () => {
    setLoading(true);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      showAlert(
        "Geolocation Not Supported",
        "Your browser doesn't support location detection. Please select your location manually on the map.",
        "destructive",
      );
      setLoading(false);
      return;
    }

    try {
      // Check permission status if the Permissions API is supported
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });

          if (permissionStatus.state === "denied") {
            showAlert(
              "Location Access Denied",
              "Please enable location permissions in your browser settings to use this feature.",
              "destructive",
            );
            setLoading(false);
            return;
          }
        } catch (permError) {
          // Some browsers might not support querying geolocation permission
          // Continue with the geolocation request anyway
          log("Permission query not supported:", permError);
        }
      }

      // Attempt to get current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let locationName = "Current Location";
          let countryCode = "";
          let isSeaLocation = false;

          // Attempt to get location name via reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            );
            const data = await response.json();
            log("Reverse geocoding data:", data);

            // Extract city/town and country from address details
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.hamlet ||
              "";
            const country = data.address?.country || "";
            countryCode = data.address?.country_code || "";

            // Format as "city, country"
            const name = [city, country].filter(Boolean).join(", ");

            // Check if location is on sea or water
            isSeaLocation =
              !city || // No city means likely on water
              data.address?.sea ||
              data.address?.ocean ||
              data.address?.water ||
              data.address?.bay;

            locationName = name || "Current Location";
          } catch (error) {
            logError("Error getting location name:", error);
          }

          const newLocation = {
            latitude: lat,
            longitude: lng,
            name: locationName,
            countryCode: countryCode,
            isSeaLocation: isSeaLocation,
          };

          log("Setting new location:", newLocation);
          handleLocationUpdate(newLocation);
          setLoading(false);
        },
        (err) => {
          logError("Error getting location:", err);
          setLoading(false);

          // Handle different error types
          switch (err.code) {
            case err.PERMISSION_DENIED:
              showAlert(
                "Location Access Denied",
                "You denied the location request. Please enable location permissions in your browser settings or select your location manually on the map.",
                "destructive",
              );
              break;
            case err.POSITION_UNAVAILABLE:
              showAlert(
                "Location Unavailable",
                "Your location information is currently unavailable. Please try again or select your location manually on the map.",
                "destructive",
              );
              break;
            case err.TIMEOUT:
              showAlert(
                "Location Request Timeout",
                "The location request took too long. Please try again or select your location manually on the map.",
                "destructive",
              );
              break;
            default:
              showAlert(
                "Location Error",
                "Unable to detect your location. Please select your location manually on the map.",
                "destructive",
              );
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } catch (error) {
      logError("Unexpected error in location detection:", error);
      showAlert(
        "Location Error",
        "An unexpected error occurred. Please select your location manually on the map.",
        "destructive",
      );
      setLoading(false);
    }
  };

  const handleMapLocationSelect = () => {
    // Access the stored map selection state
    const mapState = (window as any).mapSelectionState;
    log("mapState", mapState);
    if (mapState && mapState.selectedPosition) {
      const [lat, lng] = mapState.selectedPosition;
      const newLocation = {
        latitude: lat,
        longitude: lng,
        name: mapState.locationName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
      log("Map location selected:", newLocation);
      handleLocationUpdate(newLocation);
    } else {
      showAlert(
        "Error",
        "Please select a location on the map first.",
        "destructive",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "sm:max-w-[600px] w-[90%] rounded-[16px] shadow-xl dark:bg-card dark:border-border/30 [&>button]:hidden p-4",
          height > 768 ? "max-h-[80vh]" : "max-h-auto",
          height < 600 && "max-h-full rounded-none w-full overflow-y-auto",
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="dark:text-white">{title}</DialogTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </DialogHeader>

        {/* Alert Container */}
        {alert.show && (
          <div
            className={cn(
              "p-4 rounded-lg mb-4 border animate-in fade-in slide-in-from-top-2 duration-300",
              alert.variant === "destructive"
                ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {alert.variant === "destructive" ? (
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-semibold text-sm mb-1",
                    alert.variant === "destructive"
                      ? "text-red-800 dark:text-red-200"
                      : "text-green-800 dark:text-green-200",
                  )}
                >
                  {alert.title}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    alert.variant === "destructive"
                      ? "text-red-700 dark:text-red-300"
                      : "text-green-700 dark:text-green-300",
                  )}
                >
                  {alert.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full rounded-md overflow-hidden h-[400px] mb-4">
          <MapSelection
            onLocationSelect={handleLocationUpdate}
            currentLocation={currentLocation || DEFAULT_LOCATION}
          />
        </div>
        <div className="">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleDetectLocation}
              variant="outline"
              className="w-full h-12 border-none shadow-none bg-lishka-blue hover:bg-lishka-blue text-white hover:text-white rounded-full"
              disabled={loading}
            >
              {/* <MapPin className="mr-2" /> */}
              {loading ? "Detecting..." : "Detect my location"}
            </Button>

            <Button
              onClick={handleMapLocationSelect}
              disabled={loading}
              variant="default"
              className="confirm-location-button w-full bg-[#0251FB1A] h-12 text-lishka-blue hover:bg-[#0251FB33] hover:text-lishka-blue rounded-full shadow-none border-none"
            >
              Set this location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
