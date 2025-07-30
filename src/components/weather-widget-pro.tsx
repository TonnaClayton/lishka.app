import React, { useState, useMemo } from "react";
import { formatTemperature, formatSpeed } from "@/lib/unit-conversion";

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
import LocationModal from "./location-modal";
import { log } from "@/lib/logging";
import WeatherWidgetProSkeleton from "./weather-widget-pro-skeleton";
import {
  useLocation,
  LocationData,
  useWeatherData,
  useFishingAdvice,
  CurrentConditions,
} from "@/hooks/queries/location";
import { cn } from "@/lib/utils";

const WeatherWidget: React.FC<{
  userLocation?: LocationData;
  onLocationUpdate?: (location: LocationData) => void;
}> = ({ userLocation, onLocationUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [activeTab, setActiveTab] = useState("inshore");

  // Use React Query location hook
  const {
    location,
    isLoading: isLoadingLocation,
    error: locationError,
    updateLocation,
    updateLocationAsync,
    refreshLocation,
    refreshLocationAsync,
    isUpdating,
    isRefreshing,
  } = useLocation(userLocation);

  // Use React Query weather data hook
  const {
    weatherData,
    isLoading: isLoadingWeather,
    error: weatherError,
    isError: isWeatherError,
    refreshWeather,
    refreshWeatherAsync,
    isRefreshing: isRefreshingWeather,
    getWeatherCondition,
    lastUpdated,
  } = useWeatherData(location);

  // Create current conditions object for fishing advice
  const currentConditions: CurrentConditions | null = useMemo(() => {
    if (!weatherData || !location) return null;

    // Get current hour index
    const findCurrentHourIndex = () => {
      if (!weatherData?.hourly?.time || weatherData.hourly.time.length === 0) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      let closestIndex = 0;
      let smallestDiff = Infinity;

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

    const currentHourIndex = findCurrentHourIndex();
    const waveHeights =
      weatherData.hourly.wave_height?.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const waveDirections =
      weatherData.hourly.wave_direction?.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const swellWaveHeights =
      weatherData.hourly.swell_wave_height?.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const swellWavePeriods =
      weatherData.hourly.swell_wave_period?.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const windSpeeds =
      weatherData.hourly.wind_speed_10m.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const windDirections =
      weatherData.hourly.wind_direction_10m.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];
    const temperatures =
      weatherData.hourly.temperature_2m.slice(
        currentHourIndex,
        currentHourIndex + 1
      ) || [];

    return {
      temperature: temperatures[0] ?? null,
      windSpeed: windSpeeds[0] ?? null,
      windDirection: windDirections[0] ?? null,
      waveHeight: waveHeights[0] ?? null,
      swellWaveHeight: swellWaveHeights[0] ?? null,
      swellWavePeriod: swellWavePeriods[0] ?? null,
      weatherCondition: getWeatherCondition(),
    };
  }, [weatherData, location, getWeatherCondition]);

  // Use React Query fishing advice hook
  const {
    fishingAdvice,
    isLoading: isLoadingFishingAdvice,
    error: fishingAdviceError,
    isError: isFishingAdviceError,
    refreshFishingAdvice,
    refreshFishingAdviceAsync,
    isRefreshing: isRefreshingFishingAdvice,
  } = useFishingAdvice(location, currentConditions);

  // Removed chart refs as we're using card-based display instead

  // Handle location update
  const handleLocationUpdate = async (newLocation: LocationData) => {
    try {
      // Update location using React Query mutation
      await updateLocationAsync(newLocation);

      // Notify parent component if callback provided
      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }

      // Close the location modal
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

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
    swellWavePeriod: number | null
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
          <Sun className="h-8 w-8 text-yellow-500" />
        ) : (
          <Moon className="h-8 w-8 text-blue-200" />
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

  const handleRefresh = async () => {
    if (location && location.latitude && location.longitude) {
      try {
        // Reset states and clear cached data
        setCurrentIndex(0);

        // Trigger a fresh fetch using React Query mutations
        await Promise.all([
          refreshLocationAsync(),
          refreshWeatherAsync(),
          refreshFishingAdviceAsync(),
        ]);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  };

  const disableRefreshBtn = useMemo(() => {
    return isRefreshingWeather || isLoadingWeather || isLoadingLocation;
  }, [isRefreshingWeather, isLoadingWeather, isLoadingLocation]);

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
    weatherData?.hourly?.time?.slice(currentHourIndex, currentHourIndex + 24) ||
    [];
  const waveHeights =
    weatherData?.hourly?.wave_height?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || Array(24).fill(null);
  const waveDirections =
    weatherData?.hourly?.wave_direction?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || Array(24).fill(null);
  const swellWaveHeights =
    weatherData?.hourly?.swell_wave_height?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || Array(24).fill(null);
  const swellWaveDirections =
    weatherData?.hourly?.swell_wave_direction?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || Array(24).fill(null);
  const swellWavePeriods =
    weatherData?.hourly?.swell_wave_period?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || Array(24).fill(null);
  // Define wavePeriods as swellWavePeriods for backward compatibility
  const wavePeriods = swellWavePeriods;
  const windSpeeds =
    weatherData?.hourly?.wind_speed_10m?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || [];
  const windDirections =
    weatherData?.hourly?.wind_direction_10m?.slice(
      currentHourIndex,
      currentHourIndex + 24
    ) || [];
  const temperatures =
    weatherData?.hourly?.temperature_2m?.slice(
      currentHourIndex,
      currentHourIndex + 24
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
      !weatherData?.hourly?.precipitation_probability ||
      !weatherData?.hourly?.precipitation
    ) {
      return emptyForecast;
    }

    // Get precipitation data for next 6 hours
    const probabilities =
      weatherData?.hourly?.precipitation_probability?.slice(
        currentHourIndex,
        currentHourIndex + 6
      ) || [];
    const amounts =
      weatherData?.hourly?.precipitation?.slice(
        currentHourIndex,
        currentHourIndex + 6
      ) || [];

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
  log("Current weather data for display:", {
    location: location?.name,
    temperature: temperatures[0],
    windSpeed: windSpeeds[0],
    waveHeight: waveHeights[0],
    wavePeriod: wavePeriods[0],
    allTemps: temperatures.slice(0, 5),
  });

  // Create current conditions object with fresh data for display
  const displayConditions = {
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
        (swellWavePeriods.length > 0 ? swellWavePeriods[0] : null)
    ),
  };

  // Log the current conditions to verify
  log("Final current conditions:", displayConditions);

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

  if (isLoadingLocation || isLoadingWeather) {
    return <WeatherWidgetProSkeleton />;
  }

  if (isWeatherError || !weatherData) {
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
          disabled={disableRefreshBtn}
          onClick={handleRefresh}
          className={cn(
            "text-[#0251FB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            disableRefreshBtn && "opacity-50 cursor-not-allowe animate-spin"
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationUpdate}
        currentLocation={location}
        title="Update Your Location"
      />
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
          <div className="p-2 bg-white/10 rounded-full">{getWeatherIcon()}</div>
        </div>

        <div className="mt-6 mb-6">
          <div className="flex items-baseline">
            <span className="text-6xl font-bold">
              {weatherData?.current?.temperature_2m !== undefined &&
              weatherData.current.temperature_2m !== null
                ? formatTemperature(weatherData.current.temperature_2m).split(
                    " "
                  )[0]
                : currentConditions.temperature !== null
                  ? formatTemperature(currentConditions.temperature).split(
                      " "
                    )[0]
                  : "-"}
            </span>
          </div>
          <p className="text-sm mt-2 opacity-90">
            Feels like{" "}
            {weatherData?.current?.apparent_temperature !== undefined &&
            weatherData.current.apparent_temperature !== null
              ? formatTemperature(
                  weatherData.current.apparent_temperature
                ).split(" ")[0]
              : currentConditions.temperature !== null
                ? formatTemperature(currentConditions.temperature).split(" ")[0]
                : "-"}
            <br />
            {weatherData?.daily?.temperature_2m_max &&
            weatherData?.daily?.temperature_2m_min &&
            weatherData.daily.temperature_2m_max[0] !== null &&
            weatherData.daily.temperature_2m_min[0] !== null
              ? `Today: ${formatTemperature(weatherData.daily.temperature_2m_min[0]).split(" ")[0]} to ${formatTemperature(weatherData.daily.temperature_2m_max[0]).split(" ")[0]}`
              : temperatures &&
                  temperatures.length > 0 &&
                  temperatures.some((t) => t !== null)
                ? `Today: ${formatTemperature(Math.min(...temperatures.filter((t) => t !== null).slice(0, 24))).split(" ")[0]} to ${formatTemperature(Math.max(...temperatures.filter((t) => t !== null).slice(0, 24))).split(" ")[0]}`
                : "Today: - to -"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <Wind className="h-4 w-4 mr-1 text-blue-200" />
            </div>
            <p className="text-lg font-semibold">
              {weatherData?.current?.wind_speed_10m !== undefined &&
              weatherData.current.wind_speed_10m !== null
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
        <div className="mt-4 flex justify-between items-center bg-black/10 p-3 rounded-xl">
          <div className="flex items-center">
            <Sun className="h-4 w-4 mr-2 text-yellow-300" />
            <div>
              <p className="text-xs opacity-80">Sunrise</p>
              <p className="text-sm font-medium">
                {!weatherData?.daily?.sunrise || !weatherData.daily.sunrise[0]
                  ? "-"
                  : new Date(weatherData.daily.sunrise[0]).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Moon className="h-4 w-4 mr-2 text-blue-200" />
            <div>
              <p className="text-xs opacity-80">Sunset</p>
              <p className="text-sm font-medium">
                {!weatherData?.daily?.sunset || !weatherData.daily.sunset[0]
                  ? "-"
                  : new Date(weatherData.daily.sunset[0]).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
              </p>
            </div>
          </div>
        </div>
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
              ${displayConditions.fishingConditions === "Excellent" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
              ${displayConditions.fishingConditions === "Good" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : ""}
              ${displayConditions.fishingConditions === "Fair" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" : ""}
              ${displayConditions.fishingConditions === "Poor" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" : ""}
              text-sm px-3 py-1
            `}
            >
              {displayConditions.fishingConditions}
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
              {displayConditions.waveHeight !== null &&
              typeof displayConditions.waveHeight === "number"
                ? displayConditions.waveHeight.toFixed(1)
                : "-"}{" "}
              {displayConditions.waveHeight !== null &&
              typeof displayConditions.waveHeight === "number"
                ? weatherData?.hourly_units?.wave_height || "m"
                : ""}
            </p>
            <p className="text-xs opacity-80">Wave Height</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold">
                {displayConditions.waveDirection !== null
                  ? getWindDirection(displayConditions.waveDirection)
                  : "-"}
              </p>
              {displayConditions.waveDirection !== null && (
                <span className="text-lg">
                  {getDirectionArrow(displayConditions.waveDirection)}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80">Wave Direction</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {weatherData?.hourly?.visibility &&
              weatherData.hourly.visibility.length > 0 &&
              weatherData.hourly.visibility[0] !== null
                ? `${(weatherData.hourly.visibility[0] / 1000).toFixed(1)} km`
                : "-"}
            </p>
            <p className="text-xs opacity-80">Visibility</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-black/20 p-2 sm:p-3 rounded-xl mt-2">
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {displayConditions.swellWaveHeight !== null &&
              typeof displayConditions.swellWaveHeight === "number"
                ? displayConditions.swellWaveHeight.toFixed(1)
                : "-"}{" "}
              {displayConditions.swellWaveHeight !== null &&
              typeof displayConditions.swellWaveHeight === "number"
                ? weatherData?.hourly_units?.swell_wave_height || "m"
                : ""}
            </p>
            <p className="text-xs opacity-80">Swell Height</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {displayConditions.swellWavePeriod !== null &&
              typeof displayConditions.swellWavePeriod === "number"
                ? `${displayConditions.swellWavePeriod.toFixed(1)}s`
                : "-"}
            </p>
            <p className="text-xs opacity-80">Swell Duration</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold">
              {displayConditions.swellWavePeriod !== null &&
              typeof displayConditions.swellWavePeriod === "number"
                ? `${displayConditions.swellWavePeriod.toFixed(1)}s`
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
              ) : fishingAdvice?.inshore ? (
                <p className="text-sm">{fishingAdvice.inshore}</p>
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
              ) : fishingAdvice?.offshore ? (
                <p className="text-sm">{fishingAdvice.offshore}</p>
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
                    waveHeights[index] !== undefined
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
                    {windSpeeds[index] !== null &&
                    windSpeeds[index] !== undefined
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
            <Layers className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">
          Hourly Forecast
        </h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[1200px]">
            {times.slice(0, 12).map((time, index) => (
              <div
                key={`hourly-${index}`}
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[90px]"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {time ? formatTime(time) : "--:--"}
                </p>
                <div className="mb-2">{getWeatherIcon()}</div>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {temperatures[index] !== null &&
                  temperatures[index] !== undefined
                    ? `${Math.round(temperatures[index])}°`
                    : "-"}
                </p>

                {/* Wind Speed and Direction */}
                <div className="flex items-center mb-1">
                  <Wind className="h-3 w-3 mr-1 text-blue-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {windSpeeds[index] !== null &&
                    windSpeeds[index] !== undefined
                      ? `${Math.round(windSpeeds[index])}`
                      : "-"}
                  </p>
                  {windDirections[index] !== undefined &&
                    windDirections[index] !== null && (
                      <div className="ml-1 flex items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getWindDirection(windDirections[index])}
                        </span>
                        <span className="ml-1 text-xs">
                          {getDirectionArrow(windDirections[index])}
                        </span>
                      </div>
                    )}
                </div>

                {/* Wave Height and Direction */}
                <div className="flex items-center">
                  <Waves className="h-3 w-3 mr-1 text-blue-500" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {waveHeights[index] !== null &&
                    waveHeights[index] !== undefined
                      ? `${waveHeights[index].toFixed(1)}m`
                      : "-"}
                  </p>
                  {waveDirections[index] !== undefined &&
                    waveDirections[index] !== null && (
                      <div className="ml-1 text-xs">
                        {getDirectionArrow(waveDirections[index])}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Hourly Precipitation Card */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            Hourly Precipitation (mm)
          </h2>
          <Droplets className="h-5 w-5 text-[#0251FB] dark:text-blue-400" />
        </div>
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[800px]">
            {times.slice(0, 12).map((time, index) => {
              const precipitation =
                weatherData?.hourly?.precipitation?.[
                  currentHourIndex + index
                ] || 0;
              const precipitationProbability =
                weatherData?.hourly?.precipitation_probability?.[
                  currentHourIndex + index
                ] || 0;
              return (
                <div
                  key={`precip-${index}`}
                  className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[70px]"
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {time ? formatTime(time) : "--:--"}
                  </p>
                  <div className="flex items-center mb-1">
                    <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-300">
                      {precipitation !== null && precipitation !== undefined
                        ? precipitation.toFixed(1)
                        : "0.0"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    (
                    {precipitationProbability !== null &&
                    precipitationProbability !== undefined
                      ? `${precipitationProbability}%`
                      : "0%"}
                    )
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

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
                    weatherData?.hourly?.precipitation_probability?.[
                      currentHourIndex + hour
                    ] || 0;
                  const amount =
                    weatherData?.hourly?.precipitation?.[
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
      {/* Weekly Forecast */}
      {weatherData?.daily?.time && weatherData.daily.time.length > 0 && (
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

                  {/* Weather Icon under date */}
                  <div className="mb-2">
                    {(() => {
                      // Get weather code for this day
                      const weatherCode =
                        weatherData.daily.weather_code?.[index];

                      // If no weather code available, show default icon
                      if (weatherCode === null || weatherCode === undefined) {
                        return <CloudSun className="h-5 w-5 text-gray-500" />;
                      }

                      // Return appropriate icon based on weather code
                      switch (true) {
                        case weatherCode === 0:
                          return <Sun className="h-5 w-5 text-yellow-500" />;
                        case weatherCode === 1:
                          return <Sun className="h-5 w-5 text-yellow-500" />;
                        case weatherCode === 2:
                          return <Sun className="h-5 w-5 text-yellow-500" />;
                        case weatherCode === 3:
                          return <Cloud className="h-5 w-5 text-gray-500" />;
                        case weatherCode >= 45 && weatherCode <= 49:
                          return <CloudFog className="h-5 w-5 text-gray-400" />;
                        case weatherCode >= 51 && weatherCode <= 55:
                          return (
                            <CloudDrizzle className="h-5 w-5 text-blue-400" />
                          );
                        case weatherCode >= 56 && weatherCode <= 57:
                          return (
                            <CloudSnow className="h-5 w-5 text-blue-300" />
                          );
                        case weatherCode >= 61 && weatherCode <= 65:
                          return (
                            <CloudRain className="h-5 w-5 text-blue-500" />
                          );
                        case weatherCode >= 66 && weatherCode <= 67:
                          return (
                            <CloudHail className="h-5 w-5 text-blue-300" />
                          );
                        case weatherCode >= 71 && weatherCode <= 77:
                          return (
                            <CloudSnow className="h-5 w-5 text-blue-200" />
                          );
                        case weatherCode >= 80 && weatherCode <= 82:
                          return (
                            <CloudRain className="h-5 w-5 text-blue-500" />
                          );
                        case weatherCode >= 85 && weatherCode <= 86:
                          return (
                            <CloudSnow className="h-5 w-5 text-blue-200" />
                          );
                        case weatherCode >= 95 && weatherCode <= 99:
                          return (
                            <CloudLightning className="h-5 w-5 text-yellow-500" />
                          );
                        default:
                          return <CloudSun className="h-5 w-5 text-gray-500" />;
                      }
                    })()}
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
                      <p className="text-xs dark:text-gray-300 mr-1">
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wind speeds for this day if available
                          const dayWindSpeeds =
                            weatherData?.hourly?.wind_speed_10m?.slice(
                              dayStart,
                              dayEnd
                            );
                          if (dayWindSpeeds && dayWindSpeeds.length > 0) {
                            // Filter out null values
                            const validSpeeds = dayWindSpeeds.filter(
                              (s) => s !== null
                            );
                            if (validSpeeds.length > 0) {
                              // Calculate average wind speed
                              const avgWindSpeed =
                                validSpeeds.reduce(
                                  (sum, speed) => sum + speed,
                                  0
                                ) / validSpeeds.length;
                              return formatSpeed(avgWindSpeed).split(" ")[0];
                            }
                          }
                          return "-";
                        })()}
                      </p>
                      <p className="text-xs dark:text-gray-300 mr-1">
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wind directions for this day if available
                          const dayWindDirections =
                            weatherData?.hourly?.wind_direction_10m?.slice(
                              dayStart,
                              dayEnd
                            );
                          if (
                            dayWindDirections &&
                            dayWindDirections.length > 0
                          ) {
                            // Filter out null values
                            const validDirections = dayWindDirections.filter(
                              (d) => d !== null
                            );
                            if (validDirections.length > 0) {
                              // Calculate average wind direction
                              const avgWindDirection =
                                validDirections.reduce(
                                  (sum, direction) => sum + direction,
                                  0
                                ) / validDirections.length;
                              return getWindDirection(avgWindDirection);
                            }
                          }
                          return "-";
                        })()}
                      </p>
                      {(() => {
                        // Calculate the day's start and end indices in hourly data
                        const dayStart = index * 24;
                        const dayEnd = (index + 1) * 24;
                        // Get wind directions for this day if available
                        const dayWindDirections =
                          weatherData.hourly?.wind_direction_10m?.slice(
                            dayStart,
                            dayEnd
                          );
                        if (dayWindDirections && dayWindDirections.length > 0) {
                          // Filter out null values
                          const validDirections = dayWindDirections.filter(
                            (d) => d !== null
                          );
                          if (validDirections.length > 0) {
                            // Calculate average wind direction
                            const avgWindDirection =
                              validDirections.reduce(
                                (sum, direction) => sum + direction,
                                0
                              ) / validDirections.length;
                            return (
                              <span className="text-xs">
                                {getDirectionArrow(avgWindDirection)}
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Waves Section */}
                  <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                      Waves
                    </p>
                    <div className="flex items-center justify-center">
                      <Waves className="h-3 w-3 mr-1 text-blue-500" />
                      <p className="text-xs dark:text-gray-300 mr-1">
                        {/* Use average wave height from hourly data for this day */}
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wave heights for this day if available
                          const dayWaveHeights =
                            weatherData?.hourly?.wave_height?.slice(
                              dayStart,
                              dayEnd
                            );
                          if (dayWaveHeights && dayWaveHeights.length > 0) {
                            // Filter out null values
                            const validHeights = dayWaveHeights.filter(
                              (h) => h !== null
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
                                ? `${avgWaveHeight.toFixed(1)}m`
                                : "-";
                            }
                          }
                          return "-";
                        })()}
                      </p>
                      <p className="text-xs dark:text-gray-300 mr-1">
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wave directions for this day if available
                          const dayWaveDirections =
                            weatherData?.hourly?.wave_direction?.slice(
                              dayStart,
                              dayEnd
                            );
                          if (
                            dayWaveDirections &&
                            dayWaveDirections.length > 0
                          ) {
                            // Filter out null values
                            const validDirections = dayWaveDirections.filter(
                              (d) => d !== null
                            );
                            if (validDirections.length > 0) {
                              // Calculate average wave direction
                              const avgWaveDirection =
                                validDirections.reduce(
                                  (sum, direction) => sum + direction,
                                  0
                                ) / validDirections.length;
                              return getWindDirection(avgWaveDirection);
                            }
                          }
                          return "-";
                        })()}
                      </p>
                      {(() => {
                        // Calculate the day's start and end indices in hourly data
                        const dayStart = index * 24;
                        const dayEnd = (index + 1) * 24;
                        // Get wave directions for this day if available
                        const dayWaveDirections =
                          weatherData.hourly?.wave_direction?.slice(
                            dayStart,
                            dayEnd
                          );
                        if (dayWaveDirections && dayWaveDirections.length > 0) {
                          // Filter out null values
                          const validDirections = dayWaveDirections.filter(
                            (d) => d !== null
                          );
                          if (validDirections.length > 0) {
                            // Calculate average wave direction
                            const avgWaveDirection =
                              validDirections.reduce(
                                (sum, direction) => sum + direction,
                                0
                              ) / validDirections.length;
                            return (
                              <span className="text-xs">
                                {getDirectionArrow(avgWaveDirection)}
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
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
            <Info className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
            <span>Data provided by Open-Meteo.com</span>
          </div>
          {lastUpdated && (
            <span>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
