import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";
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
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { log } from "@/lib/logging";
import { useUserLocation } from "@/hooks/queries";
import { DEFAULT_LOCATION } from "@/lib/const";

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

  // Make selectedPosition and locationName available to parent component
  React.useEffect(() => {
    // Store these values in window for the parent component to access
    (window as any).mapSelectionState = {
      selectedPosition,
      locationName,
    };
  }, [selectedPosition, locationName, currentLocation]);

  // Set initial marker if we have a current location
  useEffect(() => {
    if (currentLocation) {
      const lat = currentLocation.latitude;
      const lng = currentLocation.longitude;
      if (lat && lng) {
        setSelectedPosition([lat, lng]);
        setLocationName(currentLocation.name);

        // Center the map on the current location
        if (map) {
          log(`Centering map on: ${lat}, ${lng} (${currentLocation.name})`);
          map.setView([lat, lng], 15);
        }
      }
    }
  }, [currentLocation, map]);

  // Make sure map is centered when it's created
  useEffect(() => {
    if (map && currentLocation) {
      const lat = currentLocation.latitude;
      const lng = currentLocation.longitude;
      log(
        `Map created, centering on: ${lat}, ${lng} (${currentLocation.name})`,
      );
      map.setView([lat, lng], 15);
    }
  }, [map]);

  // Function to handle map click and set marker
  const MapClickHandler = () => {
    // const map = useMapEvents({
    //   click: async (e) => {
    //     const { lat, lng } = e.latlng;
    //     setSelectedPosition([lat, lng]);

    //     // Attempt to get location name via reverse geocoding
    //     try {
    //       const response = await fetch(
    //         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    //       );
    //       const data = await response.json();

    //       // Extract city/town and country from address details
    //       const city =
    //         data.address?.city ||
    //         data.address?.town ||
    //         data.address?.village ||
    //         data.address?.hamlet ||
    //         "";
    //       const country = data.address?.country || "";

    //       // Format as "city, country"
    //       const name = [city, country].filter(Boolean).join(", ");

    //       // Check if location is on sea or water
    //       const isSeaLocation =
    //         !city || // No city means likely on water
    //         data.address?.sea ||
    //         data.address?.ocean ||
    //         data.address?.water ||
    //         data.address?.bay;

    //       log("Location data:", {
    //         isSeaLocation,
    //         city,
    //         country,
    //         address: data.address,
    //         lat,
    //         lng,
    //       });

    //       if (isSeaLocation) {
    //         // For sea locations, display only coordinates
    //         const formattedLat = lat.toFixed(6);
    //         const formattedLng = lng.toFixed(6);
    //         setLocationName(`${formattedLat}, ${formattedLng}`);
    //       } else {
    //         setLocationName(name);
    //       }
    //     } catch (error) {
    //       console.error("Error getting location name:", error);
    //       // Display coordinates as fallback
    //       const formattedLat = lat.toFixed(6);
    //       const formattedLng = lng.toFixed(6);
    //       setLocationName(`${formattedLat}, ${formattedLng}`);
    //     }
    //   },
    // });
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
      console.error("[LocationModal] Error saving to database:", error);
    }

    setLoading(false);
    // Call the onLocationSelect callback with the location data
    onLocationSelect(fullLocationData);

    // Close the modal
    onClose();
    // });
  };

  const handleDetectLocation = () => {
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let locationName = "Current Location";
          let countryCode = "";

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
            }
          } catch (error) {
            console.error("Error getting location name:", error);
          }

          const newLocation = {
            latitude: lat,
            longitude: lng,
            name: locationName,
            countryCode: countryCode,
          };

          log("Setting new location:", newLocation);
          handleLocationUpdate(newLocation);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);

          // If geolocation fails, set a default location instead of showing an alert
          const defaultLocation = {
            latitude: 35.8997,
            longitude: 14.5146,
            name: "Malta",
          };

          log("Setting default location after error:", defaultLocation);
          handleLocationUpdate(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      // If geolocation is not supported, set a default location
      const defaultLocation = {
        latitude: 35.8997,
        longitude: 14.5146,
        name: "Malta",
      };

      log(
        "Setting default location (no geolocation support):",
        defaultLocation,
      );
      handleLocationUpdate(defaultLocation);
      setLoading(false);
    }
  };

  const handleMapLocationSelect = () => {
    // Access the stored map selection state
    const mapState = (window as any).mapSelectionState;
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
      alert("Please select a location on the map first.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] w-[90%] rounded-[16px] max-h-[80vh] shadow-xl dark:bg-card dark:border-border/30 [&>button]:hidden p-4">
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
              <MapPin className="mr-2" />
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
