import React, { useEffect, useState, useRef } from "react";
import {
  formatTemperature,
  formatSpeed,
  formatDistance,
} from "@/lib/unit-conversion";

// Add global type for window.mapSelectionState
declare global {
  interface Window {
    mapSelectionState?: {
      selectedPosition: [number, number] | null;
      locationName: string;
    };
  }
}
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Loader2,
  Waves,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  Ship,
  CloudRain,
  Sun,
  CloudSun,
  MapPin,
  RefreshCw,
  Info,
  Navigation,
  Layers,
  Moon,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudSnow,
  CloudHail,
  CloudLightning,
  Umbrella,
  Gauge,
  Fish,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface WeatherData {
  hourly: {
    time: number[] | string[];
    wave_height?: number[];
    wave_direction?: number[];
    swell_wave_height?: number[];
    swell_wave_direction?: number[];
    swell_wave_period?: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    temperature_2m: number[];
    weather_code?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    visibility?: number[];
  };
  hourly_units: {
    wave_height?: string;
    swell_wave_height?: string;
    wind_speed_10m: string;
    temperature_2m: string;
    precipitation?: string;
    visibility?: string;
  };
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    wave_height?: number;
    wave_direction?: number;
    swell_wave_height?: number;
    swell_wave_direction?: number;
    swell_wave_period?: number;
  };
  current_units?: {
    temperature_2m: string;
    wind_speed_10m: string;
    precipitation: string;
    wave_height?: string;
    swell_wave_height?: string;
    swell_wave_period?: string;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
  // Added fields to track if marine data is from nearby coordinates
  marineDataFromNearby?: boolean;
  marineCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  _timestamp?: number; // Optional timestamp for forcing refreshes
}

// Fix Leaflet icon issue
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Map Selection Component
const MapSelection = ({ onLocationSelect, currentLocation = null }) => {
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(null);
  const [locationName, setLocationName] = useState("");
  const [map, setMap] = useState<L.Map | null>(null);
  const defaultPosition = currentLocation
    ? [
        currentLocation.latitude || currentLocation.lat,
        currentLocation.longitude || currentLocation.lng,
      ]
    : [35.8997, 14.5146]; // Use current location if available, otherwise Malta as default

  // Make selectedPosition and locationName available to parent component
  React.useEffect(() => {
    // Store these values in window for the parent component to access
    window.mapSelectionState = {
      selectedPosition,
      locationName,
    };
  }, [selectedPosition, locationName]);

  // Set initial marker if we have a current location
  useEffect(() => {
    if (currentLocation) {
      const lat = currentLocation.latitude || currentLocation.lat;
      const lng = currentLocation.longitude || currentLocation.lng;
      setSelectedPosition([lat, lng]);
      setLocationName(currentLocation.name);

      // Center the map on the current location
      if (map) {
        console.log(
          `Centering map on: ${lat}, ${lng} (${currentLocation.name})`,
        );
        map.setView([lat, lng], 15);
      }
    }
  }, [currentLocation, map]);

  // Make sure map is centered when it's created
  useEffect(() => {
    if (map && currentLocation) {
      const lat = currentLocation.latitude || currentLocation.lat;
      const lng = currentLocation.longitude || currentLocation.lng;
      console.log(
        `Map created, centering on: ${lat}, ${lng} (${currentLocation.name})`,
      );
      map.setView([lat, lng], 15);
    }
  }, [map]);

  // Listen for unit changes
  useEffect(() => {
    const handleUnitsChange = () => {
      // Force re-render when units change
      console.log("Units changed, updating map display");
      if (map) map.invalidateSize();
    };

    window.addEventListener("unitsChanged", handleUnitsChange);
    return () => {
      window.removeEventListener("unitsChanged", handleUnitsChange);
    };
  }, [map]);

  // Function to handle map click and set marker
  const MapClickHandler = () => {
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

          console.log("Location data:", {
            isSeaLocation,
            city,
            country,
            address: data.address,
            lat,
            lng,
          });

          if (isSeaLocation) {
            // For sea locations, display only coordinates
            const formattedLat = lat.toFixed(6);
            const formattedLng = lng.toFixed(6);
            setLocationName(`${formattedLat}, ${formattedLng}`);
          } else {
            setLocationName(name);
          }
        } catch (error) {
          console.error("Error getting location name:", error);
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
        center={defaultPosition}
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

const WeatherWidget: React.FC<{
  userLocation?: LocationData;
  onLocationUpdate?: (location: LocationData) => void;
}> = ({ userLocation, onLocationUpdate }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [activeTab, setActiveTab] = useState("inshore");
  const [isLoadingFishingAdvice, setIsLoadingFishingAdvice] = useState(false);
  const [inshoreAdvice, setInshoreAdvice] = useState("");
  const [offshoreAdvice, setOffshoreAdvice] = useState("");
  // Removed chart refs as we're using card-based display instead

  // Use user's location if available
  useEffect(() => {
    const loadLocation = () => {
      let locationToUse: LocationData | null = null;

      // First priority: use the location passed as a prop
      if (userLocation) {
        console.log(
          `Using provided user location: ${userLocation.name} (${userLocation.latitude}, ${userLocation.longitude})`,
        );
        locationToUse = userLocation;
      } else {
        // Second priority: try to get user's location from localStorage
        const savedLocation = localStorage.getItem("userLocationFull");
        if (savedLocation) {
          try {
            const parsedLocation = JSON.parse(savedLocation);
            if (
              parsedLocation &&
              (parsedLocation.latitude || parsedLocation.lat)
            ) {
              locationToUse = {
                latitude:
                  parsedLocation.latitude || parsedLocation.lat || 35.8997,
                longitude:
                  parsedLocation.longitude || parsedLocation.lng || 14.5146,
                name: parsedLocation.name || "Malta",
              };
              console.log(
                `Using saved location: ${locationToUse.name} (${locationToUse.latitude}, ${locationToUse.longitude})`,
              );
            }
          } catch (err) {
            console.error("Error parsing user location:", err);
          }
        }
      }

      // If we don't have a location, set Malta as default
      if (!locationToUse) {
        console.log("No location found, setting Malta as default");
        locationToUse = {
          latitude: 35.8997,
          longitude: 14.5146,
          name: "Malta",
        };
        // Also save to localStorage
        localStorage.setItem("userLocation", locationToUse.name);
        localStorage.setItem("userLocationFull", JSON.stringify(locationToUse));
      }

      // Only update location if it's different from current location
      setLocation((prevLocation) => {
        if (
          !prevLocation ||
          prevLocation.latitude !== locationToUse.latitude ||
          prevLocation.longitude !== locationToUse.longitude ||
          prevLocation.name !== locationToUse.name
        ) {
          return locationToUse;
        }
        return prevLocation;
      });
    };

    // Load location initially
    loadLocation();

    // Listen for storage changes from other components
    window.addEventListener("storage", loadLocation);

    return () => {
      window.removeEventListener("storage", loadLocation);
    };
  }, [userLocation]);

  // Handle location update
  const handleLocationUpdate = (newLocation: LocationData) => {
    // Check if location actually changed to prevent unnecessary updates
    if (
      location &&
      location.latitude === newLocation.latitude &&
      location.longitude === newLocation.longitude &&
      location.name === newLocation.name
    ) {
      setShowLocationModal(false);
      return;
    }

    // Reset fishing advice when location changes
    setInshoreAdvice("");
    setOffshoreAdvice("");

    // Update location (weather data fetch will be triggered by useEffect)
    console.log("Setting new location:", newLocation);
    setLocation(newLocation);

    // Save to localStorage for persistence across components
    localStorage.setItem("userLocation", newLocation.name);
    localStorage.setItem("userLocationFull", JSON.stringify(newLocation));

    // Notify parent component if callback provided
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }

    // Close the location modal
    setShowLocationModal(false);
  };

  // Function to fetch weather data from Open-Meteo API
  const fetchOpenMeteoData = async (
    lat: number,
    lng: number,
  ): Promise<WeatherData> => {
    console.log(`Fetching weather data for coordinates: ${lat}, ${lng}`);

    // Construct the API URLs with customer API endpoint and API key
    const weatherUrl = `https://customer-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weathercode,precipitation,precipitation_probability,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&apikey=1g8vJZI7DhEIFDIt`;

    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,swell_wave_height,swell_wave_direction,swell_wave_period&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,swell_wave_period`;

    try {
      // Fetch both weather and marine data in parallel
      const [weatherResponse, marineResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(marineUrl),
      ]);

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }

      // We'll continue even if marine API fails, just log the error
      if (!marineResponse.ok) {
        console.error(`Marine API error: ${marineResponse.status}`);
      }

      const weatherData = await weatherResponse.json();
      const marineData = await marineResponse.json();

      console.log("Weather API response:", weatherData);
      console.log("Marine API response:", marineData);

      // Merge the marine data into the weather data
      const combinedData: WeatherData = {
        ...weatherData,
        hourly: {
          ...weatherData.hourly,
          wave_height: marineData.hourly?.wave_height,
          wave_direction: marineData.hourly?.wave_direction,
          swell_wave_height: marineData.hourly?.swell_wave_height,
          swell_wave_direction: marineData.hourly?.swell_wave_direction,
          swell_wave_period: marineData.hourly?.swell_wave_period,
        },
        hourly_units: {
          ...weatherData.hourly_units,
          wave_height: marineData.hourly_units?.wave_height,
          swell_wave_height: marineData.hourly_units?.swell_wave_height,
          swell_wave_period: marineData.hourly_units?.swell_wave_period,
        },
      };

      // Add marine data to current if available
      if (weatherData.current && marineData.current) {
        combinedData.current = {
          ...weatherData.current,
          wave_height: marineData.current.wave_height,
          wave_direction: marineData.current.wave_direction,
          swell_wave_height: marineData.current.swell_wave_height,
          swell_wave_direction: marineData.current.swell_wave_direction,
          swell_wave_period: marineData.current.swell_wave_period,
        };

        combinedData.current_units = {
          ...weatherData.current_units,
          wave_height: marineData.current_units?.wave_height,
          swell_wave_height: marineData.current_units?.swell_wave_height,
          swell_wave_period: marineData.current_units?.swell_wave_period,
        };
      }

      return combinedData;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  };

  // Fetch weather data when location is set
  useEffect(() => {
    if (!location || !location.latitude || !location.longitude) return;

    // Prevent unnecessary fetches by checking if we already have data for this location
    if (
      weatherData &&
      lastUpdated &&
      Math.abs(Date.now() - lastUpdated.getTime()) < 300000
    ) {
      // 5 minutes
      return;
    }

    let isCancelled = false;

    const fetchWeatherData = async () => {
      if (isCancelled) return;

      // Reset states only when starting a new fetch
      setCurrentIndex(0);
      setWeatherData(null);
      setLoading(true);
      setError(null);

      try {
        console.log(
          `Fetching data for: ${location.name} (${location.latitude}, ${location.longitude})`,
        );

        // Fetch real data from Open-Meteo API
        const apiData = await fetchOpenMeteoData(
          location.latitude,
          location.longitude,
        );

        if (isCancelled) return;

        // Log the API data
        console.log("Fetched weather data from API:", apiData);

        // Set the weather data state
        setWeatherData(apiData);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (isCancelled) return;

        console.error("Data fetch error:", err);
        setError(
          `Failed to fetch weather data: ${err.message || "Unknown error"}`,
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to debounce rapid location changes
    const timeoutId = setTimeout(() => {
      fetchWeatherData();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [location?.latitude, location?.longitude, location?.name]);

  // Function to get AI-generated fishing advice based on current conditions
  const getFishingAdvice = async () => {
    if (!weatherData || !location) return;

    setIsLoadingFishingAdvice(true);

    try {
      // Get current season based on hemisphere
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12

      // Determine hemisphere based on latitude (negative is southern)
      const isNorthernHemisphere = location.latitude >= 0;

      let season = "";
      if (isNorthernHemisphere) {
        // Northern hemisphere seasons
        if (month >= 3 && month <= 5) season = "spring";
        else if (month >= 6 && month <= 8) season = "summer";
        else if (month >= 9 && month <= 11) season = "autumn";
        else season = "winter";
      } else {
        // Southern hemisphere seasons
        if (month >= 3 && month <= 5) season = "autumn";
        else if (month >= 6 && month <= 8) season = "winter";
        else if (month >= 9 && month <= 11) season = "spring";
        else season = "summer";
      }

      // Create prompts for inshore and offshore fishing
      const inshorePrompt = `You are an expert fishing guide. Based on these weather conditions at ${location.name}, provide brief, practical inshore fishing advice (max 3 sentences):
      - Temperature: ${currentConditions.temperature !== null ? `${Math.round(currentConditions.temperature)}°C` : "Unknown"}
      - Wind: ${currentConditions.windSpeed !== null ? `${Math.round(currentConditions.windSpeed)} km/h ${currentConditions.windDirection !== null ? getWindDirection(currentConditions.windDirection) : ""}` : "Unknown"}
      - Wave height: ${currentConditions.waveHeight !== null ? `${currentConditions.waveHeight.toFixed(1)}m` : "Unknown"}
      - Season: ${season}
      - Weather: ${getWeatherCondition()}
      
      Focus on inshore fishing tactics, best locations (general types like "sheltered bays" not specific names), and suitable species for these conditions.`;

      const offshorePrompt = `You are an expert fishing guide. Based on these weather conditions at ${location.name}, provide brief, practical offshore fishing advice (max 3 sentences):
      - Temperature: ${currentConditions.temperature !== null ? `${Math.round(currentConditions.temperature)}°C` : "Unknown"}
      - Wind: ${currentConditions.windSpeed !== null ? `${Math.round(currentConditions.windSpeed)} km/h ${currentConditions.windDirection !== null ? getWindDirection(currentConditions.windDirection) : ""}` : "Unknown"}
      - Wave height: ${currentConditions.waveHeight !== null ? `${currentConditions.waveHeight.toFixed(1)}m` : "Unknown"}
      - Swell height: ${currentConditions.swellWaveHeight !== null ? `${currentConditions.swellWaveHeight.toFixed(1)}m` : "Unknown"}
      - Swell period: ${currentConditions.swellWavePeriod !== null ? `${currentConditions.swellWavePeriod.toFixed(1)}s` : "Unknown"}
      - Season: ${season}
      - Weather: ${getWeatherCondition()}
      
      Focus on offshore fishing tactics, suitable depths, and target species for these conditions.`;

      // Make API calls to OpenAI in parallel
      const [inshoreResponse, offshoreResponse] = await Promise.all([
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: inshorePrompt }],
            max_tokens: 150,
            temperature: 0.7,
          }),
        }),
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: offshorePrompt }],
            max_tokens: 150,
            temperature: 0.7,
          }),
        }),
      ]);

      // Process responses
      if (!inshoreResponse.ok || !offshoreResponse.ok) {
        throw new Error("Failed to fetch fishing advice");
      }

      const inshoreData = await inshoreResponse.json();
      const offshoreData = await offshoreResponse.json();

      // Extract advice text from responses
      const inshoreAdviceText =
        inshoreData.choices?.[0]?.message?.content?.trim() ||
        "No inshore fishing advice available";
      const offshoreAdviceText =
        offshoreData.choices?.[0]?.message?.content?.trim() ||
        "No offshore fishing advice available";

      // Update state with advice
      setInshoreAdvice(inshoreAdviceText);
      setOffshoreAdvice(offshoreAdviceText);
    } catch (error) {
      console.error("Error fetching fishing advice:", error);
      setInshoreAdvice(
        "Unable to generate fishing advice. Please try again later.",
      );
      setOffshoreAdvice(
        "Unable to generate fishing advice. Please try again later.",
      );
    } finally {
      setIsLoadingFishingAdvice(false);
    }
  };

  // Automatically fetch fishing advice when weather data is loaded
  useEffect(() => {
    if (
      weatherData &&
      !isLoadingFishingAdvice &&
      !inshoreAdvice &&
      !offshoreAdvice &&
      location
    ) {
      // Debounce fishing advice fetching to prevent rapid calls
      const timeoutId = setTimeout(() => {
        getFishingAdvice();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [weatherData, location?.name]);

  // Removed chart drawing effect as we're using card-based display instead

  // Removed chart drawing functions as we're using card-based display instead

  // Format time for display
  const formatTime = (timeString: number | string) => {
    try {
      const date =
        typeof timeString === "number"
          ? new Date(timeString * 1000)
          : new Date(timeString);
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Error formatting time:", err);
      return "--:--";
    }
  };

  // Format date for display
  const formatDate = (timeString: number | string) => {
    try {
      const date =
        typeof timeString === "number"
          ? new Date(timeString * 1000)
          : new Date(timeString);
      if (isNaN(date.getTime())) return "--";
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "--";
    }
  };

  // Get wind direction as compass direction
  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Get direction arrow based on degrees
  const getDirectionArrow = (degrees: number) => {
    // Rotate the arrow based on the direction (North is 0 degrees)
    return (
      <div className="inline-flex items-center justify-center">
        <div
          className="text-blue-400 transform"
          style={{ transform: `rotate(${degrees}deg)` }}
        >
          ↑
        </div>
      </div>
    );
  };

  // Calculate fishing conditions rating
  const getFishingConditionsRating = (
    waveHeight: number | null,
    windSpeed: number | null,
    swellWavePeriod: number | null,
  ) => {
    // If any of the required data is missing, return "Unknown"
    if (waveHeight === null || windSpeed === null) {
      return "Unknown";
    }

    // Lower wave height, moderate wind speeds, and longer wave periods are generally better for fishing
    let score = 0;
    let factorsUsed = 0;

    // Wave height factor (lower is better)
    if (waveHeight !== null) {
      factorsUsed++;
      if (waveHeight < 0.3) score += 5;
      else if (waveHeight < 0.7) score += 4;
      else if (waveHeight < 1.2) score += 3;
      else if (waveHeight < 2) score += 2;
      else if (waveHeight < 3) score += 1;
    }

    // Wind speed factor (moderate is best)
    if (windSpeed !== null) {
      factorsUsed++;
      if (windSpeed < 5) score += 3;
      else if (windSpeed < 15) score += 5;
      else if (windSpeed < 25) score += 3;
      else if (windSpeed < 35) score += 1;
    }

    // Swell wave period factor (longer is better for stability)
    if (swellWavePeriod !== null) {
      factorsUsed++;
      if (swellWavePeriod > 10) score += 5;
      else if (swellWavePeriod > 8) score += 4;
      else if (swellWavePeriod > 6) score += 3;
      else if (swellWavePeriod > 4) score += 2;
      else score += 1;
    }

    // If we don't have any factors, return "Unknown"
    if (factorsUsed === 0) return "Unknown";

    // Calculate final rating
    const totalScore = score / factorsUsed; // Average of available factors

    if (totalScore >= 4.5) return "Excellent";
    if (totalScore >= 3.5) return "Good";
    if (totalScore >= 2.5) return "Fair";
    return "Poor";
  };

  // Get current date and format it nicely
  const getCurrentDate = () => {
    const now = new Date();
    const options = { weekday: "long", day: "numeric", month: "long" };
    return now.toLocaleDateString(
      undefined, // Use browser's locale instead of hardcoding to en-US
      options as Intl.DateTimeFormatOptions,
    );
  };

  // Get weather condition based on WMO weather code
  const getWeatherCondition = () => {
    if (!weatherData) return "Loading...";

    // Use current weather code if available, otherwise use the first hourly code
    const weatherCode =
      weatherData.current?.weather_code ??
      (weatherData.hourly.weather_code &&
      weatherData.hourly.weather_code.length > 0
        ? weatherData.hourly.weather_code[0]
        : null);

    if (weatherCode === null) {
      // Fallback to temperature-based condition if no weather code
      const temp = currentConditions.temperature;

      if (temp === null) return "Unknown";

      if (temp > 25) return "Clear sky";
      if (temp > 20) return "Partly cloudy";
      return "Cloudy";
    }

    // WMO Weather interpretation codes (https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
    switch (true) {
      case weatherCode === 0:
        return "Clear sky";
      case weatherCode === 1:
        return "Mainly clear";
      case weatherCode === 2:
        return "Partly cloudy";
      case weatherCode === 3:
        return "Overcast";
      case weatherCode >= 45 && weatherCode <= 49:
        return "Fog";
      case weatherCode >= 51 && weatherCode <= 55:
        return "Drizzle";
      case weatherCode >= 56 && weatherCode <= 57:
        return "Freezing Drizzle";
      case weatherCode >= 61 && weatherCode <= 65:
        return "Rain";
      case weatherCode >= 66 && weatherCode <= 67:
        return "Freezing Rain";
      case weatherCode >= 71 && weatherCode <= 77:
        return "Snow";
      case weatherCode >= 80 && weatherCode <= 82:
        return "Rain showers";
      case weatherCode >= 85 && weatherCode <= 86:
        return "Snow showers";
      case weatherCode >= 95 && weatherCode <= 99:
        return "Thunderstorm";
      default:
        return "Unknown";
    }
  };

  // Get weather icon based on WMO weather code
  const getWeatherIcon = () => {
    if (!weatherData) return <CloudSun className="h-8 w-8 text-gray-500" />;

    // Use current weather code if available, otherwise use the first hourly code
    const weatherCode =
      weatherData.current?.weather_code ??
      (weatherData.hourly.weather_code &&
      weatherData.hourly.weather_code.length > 0
        ? weatherData.hourly.weather_code[0]
        : null);
    const isDay = weatherData.current?.is_day ?? 1; // Default to day if not specified

    if (weatherCode === null) {
      return <CloudSun className="h-8 w-8 text-gray-500" />;
    }

    switch (true) {
      case weatherCode === 0:
        return isDay ? (
          <Sun className="h-8 w-8 text-yellow-500" />
        ) : (
          <Moon className="h-8 w-8 text-blue-200" />
        );
      case weatherCode === 1:
        return isDay ? (
          <Sun className="h-8 w-8 text-yellow-500" />
        ) : (
          <Moon className="h-8 w-8 text-blue-200" />
        );
      case weatherCode === 2:
        return isDay ? (
          <CloudSun className="h-8 w-8 text-blue-400" />
        ) : (
          <CloudMoon className="h-8 w-8 text-blue-300" />
        );
      case weatherCode === 3:
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case weatherCode >= 45 && weatherCode <= 49:
        return <CloudFog className="h-8 w-8 text-gray-400" />;
      case weatherCode >= 51 && weatherCode <= 55:
        return <CloudDrizzle className="h-8 w-8 text-blue-400" />;
      case weatherCode >= 56 && weatherCode <= 57:
        return <CloudSnow className="h-8 w-8 text-blue-300" />;
      case weatherCode >= 61 && weatherCode <= 65:
        return <CloudRain className="h-8 w-8 text-white" />;
      case weatherCode >= 66 && weatherCode <= 67:
        return <CloudHail className="h-8 w-8 text-blue-300" />;
      case weatherCode >= 71 && weatherCode <= 77:
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case weatherCode >= 80 && weatherCode <= 82:
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case weatherCode >= 85 && weatherCode <= 86:
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case weatherCode >= 95 && weatherCode <= 99:
        return <CloudLightning className="h-8 w-8 text-yellow-500" />;
      default:
        return <CloudSun className="h-8 w-8 text-gray-500" />;
    }
  };

  // Get marine advice based on current conditions
  const getMarineAdvice = () => {
    if (!weatherData || !currentConditions) {
      return "Marine data not available";
    }

    const waveHeight = currentConditions.waveHeight;
    const windSpeed = currentConditions.windSpeed;
    const swellPeriod = currentConditions.swellWavePeriod;

    let advice = "";

    // Wave height assessment
    if (waveHeight !== null && typeof waveHeight === "number") {
      if (waveHeight < 0.5) {
        advice += "Calm seas with minimal waves. Excellent for small vessels. ";
      } else if (waveHeight < 1.0) {
        advice += "Light chop with small waves. Good for most boats. ";
      } else if (waveHeight < 2.0) {
        advice += "Moderate waves. Use caution with smaller vessels. ";
      } else if (waveHeight < 3.0) {
        advice += "Rough seas with significant waves. Small craft advisory. ";
      } else {
        advice += "Dangerous wave conditions. Consider postponing trip. ";
      }
    }

    // Wind assessment
    if (windSpeed !== null && typeof windSpeed === "number") {
      if (windSpeed < 10) {
        advice += "Light winds favorable for fishing. ";
      } else if (windSpeed < 20) {
        advice += "Moderate winds may affect casting and boat positioning. ";
      } else if (windSpeed < 30) {
        advice += "Strong winds will make fishing challenging. ";
      } else {
        advice += "High winds create unsafe boating conditions. ";
      }
    }

    return advice.trim();
  };

  const handleRefresh = () => {
    if (location && location.latitude && location.longitude) {
      // Reset states and clear cached data
      setLoading(true);
      setWeatherData(null);
      setCurrentIndex(0);
      setError(null);
      setLastUpdated(null); // Clear last updated to force fresh fetch

      // Trigger a fresh fetch by updating the location with a timestamp
      const refreshedLocation = {
        ...location,
        _timestamp: Date.now(),
      };

      console.log(
        "Forcing refresh with new location object:",
        refreshedLocation,
      );
      setLocation(refreshedLocation);
    }
  };

  if (!location) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-r-0">
        <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
          No location set
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          Please set your location to get weather data
        </p>
        <Button
          onClick={() => setShowLocationModal(true)}
          className="bg-[#0251FB] dark:bg-blue-700 text-white hover:bg-[#0251FB]/90 dark:hover:bg-blue-600 rounded-full"
        >
          <MapPin className="mr-2 h-4 w-4" /> Set Location
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0251FB] dark:text-blue-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Loading weather data...
        </p>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 shadow-sm">
        <div className="text-sm text-gray-700 dark:text-red-300 space-y-2">
          <p>This could be happening because:</p>
          <ul className="list-disc pl-5">
            <li>The Open-Meteo API may be temporarily unavailable</li>
            <li>There might be a network issue with your connection</li>
            <li>
              There might be a CORS issue with the API in this environment
            </li>
          </ul>
          <p className="mt-3 text-xs">
            Please try again later or check your internet connection.
          </p>
        </div>
      </Card>
    );
  }

  // Find the current hour index in the hourly data
  const findCurrentHourIndex = () => {
    if (!weatherData?.hourly?.time || weatherData.hourly.time.length === 0) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    let closestIndex = 0;
    let smallestDiff = Infinity;

    // Find the closest time to now
    weatherData.hourly.time.forEach((time, index) => {
      const timeValue =
        typeof time === "string"
          ? Math.floor(new Date(time).getTime() / 1000)
          : time;
      const diff = Math.abs(timeValue - now);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // Get current hour index
  const currentHourIndex = findCurrentHourIndex();

  // Get current time and next few hours starting from current hour
  const times =
    weatherData.hourly.time.slice(currentHourIndex, currentHourIndex + 24) ||
    [];
  const waveHeights =
    weatherData.hourly.wave_height?.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || Array(24).fill(null);
  const waveDirections =
    weatherData.hourly.wave_direction?.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || Array(24).fill(null);
  const swellWaveHeights =
    weatherData.hourly.swell_wave_height?.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || Array(24).fill(null);
  const swellWaveDirections =
    weatherData.hourly.swell_wave_direction?.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || Array(24).fill(null);
  const swellWavePeriods =
    weatherData.hourly.swell_wave_period?.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || Array(24).fill(null);
  // Define wavePeriods as swellWavePeriods for backward compatibility
  const wavePeriods = swellWavePeriods;
  const windSpeeds =
    weatherData.hourly.wind_speed_10m.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || [];
  const windDirections =
    weatherData.hourly.wind_direction_10m.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || [];
  const temperatures =
    weatherData.hourly.temperature_2m.slice(
      currentHourIndex,
      currentHourIndex + 24,
    ) || [];

  // Calculate precipitation forecast for the next 6 hours and 24 hours
  const precipitationForecast = (() => {
    // Default empty forecast
    const emptyForecast = {
      chance: 0,
      amount: 0,
      hourByHour: [],
    };

    // Check if we have precipitation probability data
    if (
      !weatherData.hourly.precipitation_probability ||
      !weatherData.hourly.precipitation
    ) {
      return emptyForecast;
    }

    // Get precipitation data for next 6 hours
    const probabilities = weatherData.hourly.precipitation_probability.slice(
      currentHourIndex,
      currentHourIndex + 6,
    );
    const amounts = weatherData.hourly.precipitation.slice(
      currentHourIndex,
      currentHourIndex + 6,
    );

    // If no valid data, return empty forecast
    if (!probabilities.length || !amounts.length) {
      return emptyForecast;
    }

    // Calculate maximum probability in the next 6 hours
    const maxProbability = Math.max(...probabilities.filter((p) => p !== null));

    // Calculate weighted average of precipitation amount (earlier hours weighted more)
    const weights = [0.35, 0.25, 0.15, 0.1, 0.1, 0.05]; // Weights sum to 1
    let weightedAmount = 0;
    let validWeightSum = 0;

    for (let i = 0; i < 6; i++) {
      if (amounts[i] !== null && amounts[i] !== undefined) {
        weightedAmount += amounts[i] * weights[i];
        validWeightSum += weights[i];
      }
    }

    // Adjust for missing values
    const finalAmount =
      validWeightSum > 0 ? weightedAmount / validWeightSum : 0;

    // Create hour-by-hour forecast
    const hourByHour = [];
    for (let i = 0; i < 6; i++) {
      if (probabilities[i] !== null && probabilities[i] !== undefined) {
        hourByHour.push({
          hour: i,
          probability: probabilities[i],
          amount: amounts[i] !== null ? amounts[i] : 0,
        });
      }
    }

    return {
      chance: maxProbability || 0,
      amount: parseFloat(finalAmount.toFixed(1)),
      hourByHour,
    };
  })();

  // Log the data for debugging
  console.log("Current weather data for display:", {
    location: location?.name,
    temperature: temperatures[0],
    windSpeed: windSpeeds[0],
    waveHeight: waveHeights[0],
    wavePeriod: wavePeriods[0],
    allTemps: temperatures.slice(0, 5),
  });

  // Create current conditions object with fresh data
  const currentConditions = {
    waveHeight:
      weatherData?.current?.wave_height ||
      (waveHeights.length > 0 ? waveHeights[0] : null),
    waveDirection:
      weatherData?.current?.wave_direction ||
      (waveDirections.length > 0 ? waveDirections[0] : null),
    swellWaveHeight:
      weatherData?.current?.swell_wave_height ||
      (swellWaveHeights.length > 0 ? swellWaveHeights[0] : null),
    swellWaveDirection:
      weatherData?.current?.swell_wave_direction ||
      (swellWaveDirections.length > 0 ? swellWaveDirections[0] : null),
    swellWavePeriod:
      weatherData?.current?.swell_wave_period ||
      (swellWavePeriods.length > 0 ? swellWavePeriods[0] : null),
    windSpeed: windSpeeds.length > 0 ? windSpeeds[0] : null,
    windDirection: windDirections.length > 0 ? windDirections[0] : null,
    windGusts: weatherData?.current?.wind_gusts_10m || null,
    temperature: temperatures.length > 0 ? temperatures[0] : null,
    fishingConditions: getFishingConditionsRating(
      weatherData?.current?.wave_height ||
        (waveHeights.length > 0 ? waveHeights[0] : null),
      windSpeeds.length > 0 ? windSpeeds[0] : null,
      weatherData?.current?.swell_wave_period ||
        (swellWavePeriods.length > 0 ? swellWavePeriods[0] : null),
    ),
  };

  // Log the current conditions to verify
  console.log("Final current conditions:", currentConditions);

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden w-full py-4 lg:px-4">
      {/* Location Button */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLocationModal(true)}
          className="flex items-center text-[#0251FB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <MapPin className="h-5 w-5 mr-1" />
          <span className="font-medium">
            {typeof location?.name === "string"
              ? location.name.replace(/^"|"$/g, "")
              : "Unknown Location"}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-[#0251FB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {/* Location Selection Dialog */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-[600px] w-[90%] rounded-lg max-h-[80vh] shadow-xl dark:bg-card dark:border-border/30">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Update Your Location
            </DialogTitle>
          </DialogHeader>
          <div className="w-full rounded-md overflow-hidden h-[400px] mb-4">
            <MapSelection
              onLocationSelect={handleLocationUpdate}
              currentLocation={location}
            />
          </div>
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  // Show loading state
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
                          console.log("Reverse geocoding data:", data);

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
                          const name = [city, country]
                            .filter(Boolean)
                            .join(", ");

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

                        console.log("Setting new location:", newLocation);
                        handleLocationUpdate(newLocation);
                        setShowLocationModal(false);
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

                        console.log(
                          "Setting default location after error:",
                          defaultLocation,
                        );
                        handleLocationUpdate(defaultLocation);
                        setShowLocationModal(false);
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

                    console.log(
                      "Setting default location (no geolocation support):",
                      defaultLocation,
                    );
                    handleLocationUpdate(defaultLocation);
                    setShowLocationModal(false);
                    setLoading(false);
                  }
                }}
                variant="outline"
                className="w-full h-12 border-2 border-[#0251FB] dark:border-primary text-[#0251FB] dark:text-primary hover:bg-[#0251FB] hover:text-white dark:hover:bg-primary dark:hover:text-white rounded-full"
              >
                <MapPin className="mr-2" />
                {loading ? "Detecting..." : "Detect my location"}
              </Button>

              <Button
                onClick={() => {
                  // Access the stored map selection state
                  const mapState = window.mapSelectionState;
                  if (mapState && mapState.selectedPosition) {
                    const [lat, lng] = mapState.selectedPosition;
                    const newLocation = {
                      latitude: lat,
                      longitude: lng,
                      name:
                        mapState.locationName ||
                        `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    };
                    handleLocationUpdate(newLocation);
                    setShowLocationModal(false);
                  } else {
                    alert("Please select a location on the map first.");
                  }
                }}
                variant="default"
                className="confirm-location-button w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-full"
              >
                Set this location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Weather Card - Enhanced Weather Data */}
      <Card className="p-6 bg-gradient-to-br from-[#0251FB] to-[#1E40AF] text-white overflow-hidden relative shadow-md rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium opacity-90">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="text-sm opacity-80">{getWeatherCondition()}</p>
          </div>
          <div className="p-2 bg-white/10 rounded-full">
            {getWeatherIcon(true)}
          </div>
        </div>

        <div className="mt-6 mb-6">
          <div className="flex items-baseline">
            <span className="text-6xl font-bold">
              {weatherData?.current?.temperature_2m !== undefined
                ? formatTemperature(weatherData.current.temperature_2m).split(
                    " ",
                  )[0]
                : currentConditions.temperature !== null
                  ? formatTemperature(currentConditions.temperature).split(
                      " ",
                    )[0]
                  : "-"}
            </span>
          </div>
          <p className="text-sm mt-2 opacity-90">
            Feels like{" "}
            {weatherData?.current?.apparent_temperature !== undefined
              ? formatTemperature(
                  weatherData.current.apparent_temperature,
                ).split(" ")[0]
              : currentConditions.temperature !== null
                ? formatTemperature(currentConditions.temperature).split(" ")[0]
                : "-"}
            <br />
            {weatherData?.daily?.temperature_2m_max &&
            weatherData?.daily?.temperature_2m_min
              ? `Today: ${formatTemperature(weatherData.daily.temperature_2m_min[0]).split(" ")[0]} to ${formatTemperature(weatherData.daily.temperature_2m_max[0]).split(" ")[0]}`
              : temperatures && temperatures.length > 0
                ? `Today: ${formatTemperature(Math.min(...temperatures.slice(0, 24))).split(" ")[0]} to ${formatTemperature(Math.max(...temperatures.slice(0, 24))).split(" ")[0]}`
                : "-"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <Wind className="h-4 w-4 mr-1 text-blue-200" />
            </div>
            <p className="text-lg font-semibold">
              {weatherData?.current?.wind_speed_10m !== undefined
                ? `${Math.round(weatherData.current.wind_speed_10m)}`
                : currentConditions.windSpeed !== null
                  ? `${Math.round(currentConditions.windSpeed)}`
                  : "-"}
              {weatherData?.current?.wind_gusts_10m !== undefined &&
                weatherData?.current?.wind_gusts_10m !== null && (
                  <span className="text-sm ml-1">
                    ({Math.round(weatherData.current.wind_gusts_10m)})
                  </span>
                )}
            </p>
            <p className="text-xs opacity-80">km/h (gusts)</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <Umbrella className="h-4 w-4 mr-1 text-blue-200" />
            </div>
            <p className="text-lg font-semibold">
              {precipitationForecast.chance > 0
                ? `${precipitationForecast.chance}%`
                : weatherData?.hourly?.precipitation_probability &&
                    weatherData.hourly.precipitation_probability.length > 0 &&
                    weatherData.hourly.precipitation_probability[0] !== null
                  ? `${weatherData.hourly.precipitation_probability[0]}%`
                  : "0%"}
            </p>
            <p className="text-xs opacity-80">6h Precip</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <Gauge className="h-4 w-4 mr-1 text-blue-200" />
            </div>
            <p className="text-lg font-semibold">
              {weatherData?.daily?.uv_index_max &&
              weatherData.daily.uv_index_max.length > 0 &&
              weatherData.daily.uv_index_max[0] !== null
                ? `${Math.round(weatherData.daily.uv_index_max[0])}`
                : "-"}
            </p>
            <p className="text-xs opacity-80">UV Index</p>
          </div>
        </div>

        {/* Sunrise/Sunset */}
        {weatherData?.daily?.sunrise && weatherData?.daily?.sunset && (
          <div className="mt-4 flex justify-between items-center bg-black/10 p-3 rounded-xl">
            <div className="flex items-center">
              <Sun className="h-4 w-4 mr-2 text-yellow-300" />
              <div>
                <p className="text-xs opacity-80">Sunrise</p>
                <p className="text-sm font-medium">
                  {new Date(weatherData.daily.sunrise[0]).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Moon className="h-4 w-4 mr-2 text-blue-200" />
              <div>
                <p className="text-xs opacity-80">Sunset</p>
                <p className="text-sm font-medium">
                  {new Date(weatherData.daily.sunset[0]).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
      {/* Marine Card - Fishing Conditions */}
      <Card className="p-6 bg-[#1E40AF] text-white overflow-hidden relative shadow-md mt-4 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium opacity-90">
              Marine Conditions
            </h2>
            <p className="text-sm opacity-80">Fishing Forecast</p>
          </div>
          <div className="p-2 bg-white/10 rounded-full">
            <Ship className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2">
            <Badge
              className={`
              ${currentConditions.fishingConditions === "Excellent" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
              ${currentConditions.fishingConditions === "Good" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : ""}
              ${currentConditions.fishingConditions === "Fair" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" : ""}
              ${currentConditions.fishingConditions === "Poor" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" : ""}
              text-sm px-3 py-1
            `}
            >
              {currentConditions.fishingConditions}
            </Badge>
            {isLoadingRecommendation && (
              <div className="ml-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="space-y-3 mt-3">
            <div>
              <p className="text-sm">{getMarineAdvice()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl">
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {currentConditions.waveHeight !== null &&
              typeof currentConditions.waveHeight === "number"
                ? currentConditions.waveHeight.toFixed(1)
                : "-"}{" "}
              {currentConditions.waveHeight !== null &&
              typeof currentConditions.waveHeight === "number"
                ? weatherData?.hourly_units?.wave_height || "m"
                : ""}
            </p>
            <p className="text-xs opacity-80">Wave Height</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold">
                {currentConditions.waveDirection !== null
                  ? getWindDirection(currentConditions.waveDirection)
                  : "-"}
              </p>
              {currentConditions.waveDirection !== null && (
                <span className="text-lg">
                  {getDirectionArrow(currentConditions.waveDirection)}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80">Wave Direction</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {weatherData?.hourly?.visibility &&
              weatherData.hourly.visibility.length > 0
                ? `${(weatherData.hourly.visibility[0] / 1000).toFixed(1)}`
                : "-"}
              {weatherData?.hourly?.visibility &&
              weatherData.hourly.visibility.length > 0
                ? " km"
                : ""}
            </p>
            <p className="text-xs opacity-80">Visibility</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-black/20 p-2 sm:p-3 rounded-xl mt-2">
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {currentConditions.swellWaveHeight !== null &&
              typeof currentConditions.swellWaveHeight === "number"
                ? currentConditions.swellWaveHeight.toFixed(1)
                : "-"}{" "}
              {currentConditions.swellWaveHeight !== null &&
              typeof currentConditions.swellWaveHeight === "number"
                ? weatherData?.hourly_units?.swell_wave_height || "m"
                : ""}
            </p>
            <p className="text-xs opacity-80">Swell Height</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {currentConditions.swellWavePeriod !== null &&
              typeof currentConditions.swellWavePeriod === "number"
                ? `${currentConditions.swellWavePeriod.toFixed(1)}s`
                : "-"}
            </p>
            <p className="text-xs opacity-80">Swell Duration</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {currentConditions.swellWavePeriod !== null &&
              typeof currentConditions.swellWavePeriod === "number"
                ? `${currentConditions.swellWavePeriod.toFixed(1)}s`
                : "-"}
            </p>
            <p className="text-xs opacity-80">Swell Period</p>
          </div>
        </div>
      </Card>
      {/* Fishing Conditions Card */}
      <Card className="p-6 lg:p-8 bg-white dark:bg-card overflow-hidden relative shadow-sm mt-4 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">
              Fishing Conditions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-Generated Advice
            </p>
          </div>
          <div>
            <Fish className="h-8 w-8 text-[#0251FB] dark:text-blue-400" />
          </div>
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="inshore"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="inshore">Inshore</TabsTrigger>
              <TabsTrigger value="offshore">Offshore</TabsTrigger>
            </TabsList>
            <TabsContent
              value="inshore"
              className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
            >
              {isLoadingFishingAdvice ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0251FB] dark:text-blue-400" />
                </div>
              ) : inshoreAdvice ? (
                <p className="text-sm">{inshoreAdvice}</p>
              ) : (
                <p className="text-sm italic">
                  No inshore fishing advice available
                </p>
              )}
            </TabsContent>
            <TabsContent
              value="offshore"
              className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
            >
              {isLoadingFishingAdvice ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0251FB] dark:text-blue-400" />
                </div>
              ) : offshoreAdvice ? (
                <p className="text-sm">{offshoreAdvice}</p>
              ) : (
                <p className="text-sm italic">
                  No offshore fishing advice available
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
      {/* Marine Data Hourly Cards */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            Marine Data Forecast
          </h2>
          <Navigation className="h-5 w-5 text-[#0251FB] dark:text-blue-400" />
        </div>

        {/* Wave Height Hourly Card */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Waves className="h-5 w-5 mr-2 text-[#0251FB] dark:text-blue-400" />
            <h3 className="text-md font-medium dark:text-white">
              Wave Height (m)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-[800px]">
              {times.slice(0, 12).map((time, index) => (
                <div
                  key={`wave-${index}`}
                  className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-[70px]"
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {time ? formatTime(time) : "--:--"}
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-300">
                    {waveHeights[index] !== null &&
                    waveHeights[index] !== undefined &&
                    typeof waveHeights[index] === "number"
                      ? waveHeights[index].toFixed(1)
                      : "-"}
                  </p>
                  {waveDirections[index] !== undefined &&
                    waveDirections[index] !== null && (
                      <div className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                        {getDirectionArrow(waveDirections[index])}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wind Speed Hourly Card */}
        <div>
          <div className="flex items-center mb-2">
            <Wind className="h-5 w-5 mr-2 text-[#0251FB] dark:text-blue-400" />
            <h3 className="text-md font-medium dark:text-white">
              Wind Speed (km/h)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-[800px]">
              {times.slice(0, 24).map((time, index) => (
                <div
                  key={`wind-${index}`}
                  className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[70px]"
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {time ? formatTime(time) : "--:--"}
                  </p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {windSpeeds[index] !== undefined &&
                    windSpeeds[index] !== null
                      ? Math.round(windSpeeds[index])
                      : "-"}
                  </p>
                  {windDirections[index] !== undefined &&
                    windDirections[index] !== null && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        {getWindDirection(windDirections[index])}
                        <span className="ml-1">
                          {getDirectionArrow(windDirections[index])}
                        </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-4">
          <p className="text-sm font-medium mb-1 dark:text-white">
            Data Sources:
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-white" />
            <span>Open-Meteo Weather & Marine API</span>
          </div>
          {location && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
              {weatherData?.marineDataFromNearby ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Note: Marine data is from nearby coordinates as it was not
                  available at your exact location
                  {weatherData?.marineCoordinates && (
                    <span>
                      {" "}
                      ({weatherData.marineCoordinates.latitude.toFixed(2)},{" "}
                      {weatherData.marineCoordinates.longitude.toFixed(2)})
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  Note: Marine data may be from nearby coordinates if not
                  available at exact location
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
      {/* Hourly Forecast */}
      {/* Precipitation Forecast Card */}
      {precipitationForecast && precipitationForecast.chance > 0 && (
        <Card className="p-4 bg-white dark:bg-card shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              Precipitation Forecast
            </h2>
            <CloudRain className="h-5 w-5 text-white" />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium dark:text-white">
              Next 6 hours: {precipitationForecast.chance}% chance,{" "}
              {precipitationForecast.amount}mm expected
            </p>
          </div>

          {/* 24-hour Precipitation Forecast */}
          <div className="mt-4 sm:mt-6">
            <div className="overflow-x-auto">
              <div className="flex space-x-1 sm:space-x-2 pb-2 min-w-[300px] w-full sm:min-w-[800px] md:min-w-[1200px] lg:min-w-[1600px] sm:w-auto">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                  const probability =
                    weatherData.hourly.precipitation_probability?.[
                      currentHourIndex + hour
                    ] || 0;
                  const amount =
                    weatherData.hourly.precipitation?.[
                      currentHourIndex + hour
                    ] || 0;
                  return (
                    <div
                      key={`precip-24h-${hour}`}
                      className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[50px]"
                    >
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {times[hour] ? formatTime(times[hour]) : `+${hour}h`}
                      </p>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-4 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative"
                          title={`${probability}% chance, ${amount.toFixed(1)}mm`}
                        >
                          <div
                            className="absolute bottom-0 w-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                            style={{
                              height: `${Math.max(5, probability)}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {probability}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">
          Hourly Forecast
        </h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[800px]">
            {times.slice(0, 24).map((time, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[80px]"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {time ? formatTime(time) : "--:--"}
                </p>

                {/* Weather Icon - simplified version */}
                <div className="mb-2">
                  {index % 2 === 0 ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CloudSun className="h-5 w-5 text-blue-400" />
                  )}
                </div>

                {/* Temperature */}
                <div className="flex items-center mb-2">
                  <Thermometer className="h-3 w-3 mr-1 text-red-500" />
                  <p className="text-sm font-bold dark:text-white">
                    {temperatures[index] !== undefined &&
                    temperatures[index] !== null
                      ? `${Math.round(temperatures[index])}°`
                      : "-"}
                  </p>
                </div>

                {/* Wave Height */}
                <div className="flex items-center mb-1">
                  <Waves className="h-3 w-3 mr-1 text-blue-500" />
                  <p className="text-xs dark:text-gray-300">
                    {waveHeights[index] !== null &&
                    waveHeights[index] !== undefined &&
                    typeof waveHeights[index] === "number"
                      ? `${waveHeights[index].toFixed(1)}m`
                      : "-"}
                  </p>
                </div>

                {/* Wind */}
                <div className="flex items-center">
                  <Wind className="h-3 w-3 mr-1 text-blue-400" />
                  <p className="text-xs dark:text-gray-300">
                    {windSpeeds[index] !== undefined &&
                    windSpeeds[index] !== null
                      ? `${Math.round(windSpeeds[index])}`
                      : "-"}
                  </p>
                  <p className="text-xs ml-1 dark:text-gray-400">
                    {windDirections[index] !== undefined &&
                    windDirections[index] !== null
                      ? getWindDirection(windDirections[index])
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {/* Weekly Forecast */}
      {weatherData?.daily && (
        <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            Weekly Forecast
          </h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-[800px]">
              {weatherData.daily.time.slice(0, 7).map((time, index) => (
                <div
                  key={`day-${index}`}
                  className="flex flex-col items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0 w-[100px] sm:w-[120px]"
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(time).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                  {/* Weather Icon */}
                  <div className="mb-2">
                    {weatherData.daily.weather_code && (
                      <>
                        {weatherData.daily.weather_code[index] === 0 ? (
                          <Sun className="h-5 w-5 text-yellow-500" />
                        ) : weatherData.daily.weather_code[index] <= 3 ? (
                          <CloudSun className="h-5 w-5 text-blue-400" />
                        ) : weatherData.daily.weather_code[index] <= 49 ? (
                          <CloudFog className="h-5 w-5 text-gray-400" />
                        ) : weatherData.daily.weather_code[index] <= 69 ? (
                          <CloudRain className="h-5 w-5 text-blue-500" />
                        ) : weatherData.daily.weather_code[index] <= 79 ? (
                          <CloudSnow className="h-5 w-5 text-blue-200" />
                        ) : weatherData.daily.weather_code[index] <= 84 ? (
                          <CloudRain className="h-5 w-5 text-blue-500" />
                        ) : weatherData.daily.weather_code[index] <= 94 ? (
                          <CloudSnow className="h-5 w-5 text-blue-200" />
                        ) : (
                          <CloudLightning className="h-5 w-5 text-yellow-500" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Temperature Section */}
                  <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                      Temperature
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 mr-1 text-red-500" />
                        <p className="text-sm font-bold dark:text-white">
                          {weatherData.daily.temperature_2m_max &&
                          weatherData.daily.temperature_2m_max[index] !== null
                            ? `${Math.round(weatherData.daily.temperature_2m_max[index])}°`
                            : "-"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 mr-1 text-blue-500" />
                        <p className="text-xs dark:text-gray-300">
                          {weatherData.daily.temperature_2m_min &&
                          weatherData.daily.temperature_2m_min[index] !== null
                            ? `${Math.round(weatherData.daily.temperature_2m_min[index])}°`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Wind Section */}
                  <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                      Wind
                    </p>
                    <div className="flex items-center justify-center">
                      <Wind className="h-3 w-3 mr-1 text-blue-400" />
                      <p className="text-xs dark:text-gray-300">
                        {/* Use average wind speed from hourly data for this day */}
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wind speeds for this day if available
                          const dayWindSpeeds =
                            weatherData.hourly?.wind_speed_10m?.slice(
                              dayStart,
                              dayEnd,
                            );
                          if (dayWindSpeeds && dayWindSpeeds.length > 0) {
                            // Filter out null values
                            const validSpeeds = dayWindSpeeds.filter(
                              (s) => s !== null,
                            );
                            if (validSpeeds.length > 0) {
                              // Calculate average wind speed
                              const avgWindSpeed =
                                validSpeeds.reduce(
                                  (sum, speed) => sum + speed,
                                  0,
                                ) / validSpeeds.length;
                              return formatSpeed(avgWindSpeed).split(" ")[0];
                            }
                          }
                          return "-";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Waves Section */}
                  <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                      Waves
                    </p>
                    <div className="flex items-center justify-center">
                      <Waves className="h-3 w-3 mr-1 text-blue-500" />
                      <p className="text-xs dark:text-gray-300">
                        {/* Use average wave height from hourly data for this day */}
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wave heights for this day if available
                          const dayWaveHeights =
                            weatherData.hourly?.wave_height?.slice(
                              dayStart,
                              dayEnd,
                            );
                          if (dayWaveHeights && dayWaveHeights.length > 0) {
                            // Filter out null values
                            const validHeights = dayWaveHeights.filter(
                              (h) => h !== null,
                            );
                            if (validHeights.length > 0) {
                              // Calculate average wave height
                              const avgWaveHeight =
                                validHeights.reduce((sum, height) => {
                                  // Ensure height is a number before adding
                                  return (
                                    sum +
                                    (typeof height === "number" ? height : 0)
                                  );
                                }, 0) / validHeights.length;
                              return typeof avgWaveHeight === "number"
                                ? `${avgWaveHeight.toFixed(1)} m`
                                : "-";
                            }
                          }
                          return "-";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* UV Index if available */}
                  {weatherData.daily.uv_index_max && (
                    <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2">
                      <div className="flex items-center justify-center">
                        <Sun className="h-3 w-3 mr-1 text-yellow-500" />
                        <p className="text-xs dark:text-gray-300">
                          UV:{" "}
                          {weatherData.daily.uv_index_max[index] !== null
                            ? Math.round(weatherData.daily.uv_index_max[index])
                            : "-"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      {/* Data Source Information */}
      <div className="flex flex-col space-y-2 text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1 text-white" />
            <span>Data provided by Open-Meteo.com</span>
          </div>
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
