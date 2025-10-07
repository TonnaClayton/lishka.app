import React, { useState, useMemo } from "react";
import { formatSpeed } from "@/lib/unit-conversion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Waves,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Info,
  Layers,
  CloudRain,
  Sun,
} from "lucide-react";
import { log } from "@/lib/logging";
import WeatherWidgetProSkeleton from "./skeletons/weather-widget-pro-skeleton";
import {
  useUserLocation,
  LocationData,
  useWeatherData,
  CurrentConditions,
} from "@/hooks/queries/location";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/queries/profile";
import {
  formatTime,
  getWindDirection,
  getDirectionArrow,
  getFishingConditionsRating,
  getMarineAdvice,
  findCurrentHourIndex,
} from "@/lib/weather-utils";
import {
  getIconForWeatherCode,
  getDailyWeatherIcon,
} from "@/lib/weather-icons";
import { calculatePrecipitationForecast } from "@/lib/precipitation-utils";
import { WeatherCard } from "./weather/weather-card";
import { MarineCard } from "./weather/marine-card";
import { FishingConditions } from "./weather/fishing-conditions";
import LocationModal from "./location-modal";
import LocationBtn from "./location-btn";

const WeatherWidget: React.FC<{
  userLocation?: LocationData;
  onLocationUpdate?: (location: LocationData) => void;
  className?: string;
  hideLocation?: boolean;
}> = ({ className, hideLocation = false }) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingRecommendation] = useState(false);
  const [activeTab, setActiveTab] = useState("inshore");
  const { user, profile } = useAuth();
  const { isLoading: isLoadingProfile } = useProfile(user?.id);

  const useImperialUnits = useMemo(() => {
    return profile?.use_imperial_units || false;
  }, [profile]);

  // Use React Query location hook
  const {
    location,
    isLoading: isLoadingLocation,
    refreshLocationAsync,
  } = useUserLocation();

  // Use React Query weather data hook
  const {
    weatherData,
    isLoading: isLoadingWeather,
    isError: isWeatherError,
    refreshWeatherAsync,
    isRefreshing: isRefreshingWeather,
    getWeatherCondition,
    lastUpdated,
  } = useWeatherData(location);

  // Create current conditions object for fishing advice
  const currentConditions: CurrentConditions | null = useMemo(() => {
    if (!weatherData || !location) return null;

    const currentHourIndex = findCurrentHourIndex(
      weatherData.hourly?.time || [],
    );
    const waveHeights =
      weatherData.hourly.wave_height?.slice(
        currentHourIndex,
        currentHourIndex + 1,
      ) || [];
    // const waveDirections =
    //   weatherData.hourly.wave_direction?.slice(
    //     currentHourIndex,
    //     currentHourIndex + 1
    //   ) || [];
    const swellWaveHeights =
      weatherData.hourly.swell_wave_height?.slice(
        currentHourIndex,
        currentHourIndex + 1,
      ) || [];
    const swellWavePeriods =
      weatherData.hourly.swell_wave_period?.slice(
        currentHourIndex,
        currentHourIndex + 1,
      ) || [];
    const windSpeeds =
      weatherData.hourly.wind_speed_10m.slice(
        currentHourIndex,
        currentHourIndex + 1,
      ) || [];
    const windDirections =
      weatherData.hourly.wind_direction_10m.slice(
        currentHourIndex,
        currentHourIndex + 1,
      ) || [];
    const temperatures =
      weatherData.hourly.temperature_2m.slice(
        currentHourIndex,
        currentHourIndex + 1,
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

  const handleRefresh = async () => {
    if (location && location.latitude && location.longitude) {
      try {
        // Reset states and clear cached data

        // Trigger a fresh fetch using React Query mutations
        await Promise.all([refreshLocationAsync(), refreshWeatherAsync()]);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  };

  const disableRefreshBtn = useMemo(() => {
    return isRefreshingWeather || isLoadingWeather || isLoadingLocation;
  }, [isRefreshingWeather, isLoadingWeather, isLoadingLocation]);

  // Get current hour index
  const currentHourIndex = findCurrentHourIndex(
    weatherData?.hourly?.time || [],
  );

  // Extract hourly data arrays
  const getHourlySlice = (data: any[], hours: number = 24) =>
    data?.slice(currentHourIndex, currentHourIndex + hours) ||
    Array(hours).fill(null);

  const times = getHourlySlice(weatherData?.hourly?.time || [], 24);
  const weatherCodes = getHourlySlice(
    weatherData?.hourly?.weather_code || [],
    24,
  );
  const waveHeights = getHourlySlice(weatherData?.hourly?.wave_height || []);
  const waveDirections = getHourlySlice(
    weatherData?.hourly?.wave_direction || [],
  );
  const swellWaveHeights = getHourlySlice(
    weatherData?.hourly?.swell_wave_height || [],
  );
  const swellWaveDirections = getHourlySlice(
    weatherData?.hourly?.swell_wave_direction || [],
  );
  const swellWavePeriods = getHourlySlice(
    weatherData?.hourly?.swell_wave_period || [],
  );
  const windSpeeds = getHourlySlice(weatherData?.hourly?.wind_speed_10m || []);
  const windDirections = getHourlySlice(
    weatherData?.hourly?.wind_direction_10m || [],
  );
  const temperatures = getHourlySlice(
    weatherData?.hourly?.temperature_2m || [],
  );
  const wavePeriods = swellWavePeriods;

  // Calculate precipitation forecast for the next 6 hours and 24 hours
  const precipitationForecast = calculatePrecipitationForecast(
    weatherData,
    currentHourIndex,
  );

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
        (swellWavePeriods.length > 0 ? swellWavePeriods[0] : null),
    ),
  };

  // Log the current conditions to verify
  log("Final current conditions:", displayConditions);

  if (isLoadingLocation || isLoadingWeather || isLoadingProfile) {
    return <WeatherWidgetProSkeleton />;
  }

  if (!location && !isLoadingLocation) {
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
          className="bg-lishka-blue  text-white hover:bg-lishka-blue/90 dark:hover:bg-lishka-blue rounded-full"
        >
          <MapPin className="mr-2 h-4 w-4" /> Set Location
        </Button>
      </div>
    );
  }

  if (isWeatherError || !weatherData) {
    return (
      <div className="px-4 py-4">
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
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-4 max-w-full overflow-x-hidden w-full py-4 lg:px-4",
        className,
      )}
    >
      {/* Location Button */}
      {hideLocation == false && (
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center text-lishka-blue px-0  hover:px-2 hover:bg-blue-50"
          >
            <LocationBtn
              useLocationContext={true}
              location={location}
              iconClassName="ml-1"
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disableRefreshBtn}
            onClick={handleRefresh}
            className={cn(
              "text-lishka-blue  hover:bg-blue-50",
              disableRefreshBtn && "opacity-50 cursor-not-allowe animate-spin",
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Location Modal */}

      {/* Weather Card */}
      <WeatherCard
        weatherData={weatherData}
        currentConditions={currentConditions}
        precipitationForecast={precipitationForecast}
        getWeatherCondition={getWeatherCondition}
      />
      {/* Marine Card */}
      <MarineCard
        displayConditions={displayConditions}
        weatherData={weatherData}
        getMarineAdvice={() =>
          getMarineAdvice(
            currentConditions?.waveHeight || null,
            currentConditions?.windSpeed || null,
          )
        }
        isLoadingRecommendation={isLoadingRecommendation}
      />
      {/* Fishing Conditions Card */}
      <FishingConditions
        fishingAdvice={{
          inshore: weatherData?.inshoreAdvice || "",
          offshore: weatherData?.offshoreAdvice || "",
        }}
        isLoadingFishingAdvice={
          isRefreshingWeather || isLoadingWeather || isLoadingLocation
        }
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {/* Marine Data Hourly Cards */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            Marine Data Forecast
          </h2>
        </div>

        {/* Wave Height Hourly Card */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Waves className="h-5 w-5 mr-2 text-lishka-blue " />
            <h3 className="text-md font-medium dark:text-white">
              Wave Height (m)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2 min-w-[800px]">
              {times.slice(0, 12).map((time, index) => (
                <div
                  key={`wave-${index}`}
                  className="flex flex-col items-center p-3 bg-[#025DFB0D] rounded-[8px] flex-shrink-0 min-w-[70px]"
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {time ? formatTime(time) : "--:--"}
                  </p>
                  <p className="text-lg font-bold text-lishka-blue ">
                    {waveHeights[index] !== null &&
                    waveHeights[index] !== undefined
                      ? waveHeights[index].toFixed(1)
                      : "-"}
                  </p>
                  {waveDirections[index] !== undefined &&
                    waveDirections[index] !== null && (
                      <div className="mt-1 text-xs text-lishka-blue ">
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
            <Wind className="h-5 w-5 mr-2 text-lishka-blue " />
            <h3 className="text-md font-medium dark:text-white">
              Wind Speed (km/h)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2 min-w-[800px]">
              {times.slice(0, 24).map((time, index) => (
                <div
                  key={`wind-${index}`}
                  className="flex flex-col items-center p-3 bg-[#F7F7F7] rounded-[8px] flex-shrink-0 min-w-[70px]"
                >
                  <p className="text-xs font-medium text-[#6B7280] mb-1">
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
                      <div className="mt-1 text-xs text-[#191B1FCC] flex items-center">
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

        <div className="p-3 bg-[#F7F7F7] rounded-md mt-4">
          <p className="text-sm font-medium mb-1 text-[#191B1F]">
            Data Sources:
          </p>
          <div className="text-xs text-[#191B1FCC]  flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#191B1FCC] " />
            <span>Open-Meteo Weather & Marine API</span>
          </div>
          {location && (
            <div className="text-xs text-[#6B7280]  mt-1 italic">
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
          <div className="flex gap-3 pb-2 min-w-[1200px]">
            {times.slice(0, 12).map((time, index) => (
              <div
                key={`hourly-${index}`}
                className="flex flex-col flex-shrink-0 items-center p-3 bg-[#F7F7F7] rounded-[8px] min-w-[90px]"
              >
                <p className="text-xs font-medium text-[#6B7280] mb-1">
                  {time ? formatTime(time) : "--:--"}
                </p>
                <div className="mb-2">
                  {getIconForWeatherCode(weatherCodes[index], "h-5 w-5", 1)}
                </div>
                <p className="text-lg font-bold text-[#191B1F] mb-2">
                  {temperatures[index] !== null &&
                  temperatures[index] !== undefined
                    ? `${Math.round(temperatures[index])}°`
                    : "-"}
                </p>

                {/* Wind Speed and Direction */}
                <div className="flex items-center mb-1">
                  <Wind className="h-3 w-3 mr-1 text-lishka-blue" />
                  <p className="text-xs text-[#191B1FCC]">
                    {windSpeeds[index] !== null &&
                    windSpeeds[index] !== undefined
                      ? `${Math.round(windSpeeds[index])}`
                      : "-"}
                  </p>
                  {windDirections[index] !== undefined &&
                    windDirections[index] !== null && (
                      <div className="ml-1 flex items-center">
                        <span className="text-xs text-[#191B1FCC] ">
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
                  <Waves className="h-3 w-3 mr-1 text-lishka-blue" />
                  <p className="text-xs text-[#191B1FCC]">
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
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2 min-w-[800px]">
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
                  className="flex flex-col flex-shrink-0 items-center p-3 bg-[#F7F7F7] rounded-lg min-w-[70px]"
                >
                  <p className="text-xs font-medium text-[#6B7280] mb-1">
                    {time ? formatTime(time) : "--:--"}
                  </p>
                  <div className="flex items-center mb-1">
                    <Droplets className="h-3 w-3 mr-1 text-lishka-blue" />
                    <p className="text-sm font-bold text-lishka-blue ">
                      {precipitation !== null && precipitation !== undefined
                        ? precipitation.toFixed(1)
                        : "0.0"}
                    </p>
                  </div>
                  <p className="text-xs text-[#191B1FCC] ">
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
          <div className="bg-blue-50 /20 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium dark:text-white">
              Next 6 hours: {precipitationForecast.chance}% chance,{" "}
              {precipitationForecast.amount}mm expected
            </p>
          </div>

          {/* 24-hour Precipitation Forecast */}
          <div className="mt-4 sm:mt-6">
            <div className="overflow-x-auto">
              <div className="flex gap-1 sm:gap-2 pb-2 min-w-[300px] w-full sm:min-w-[800px] md:min-w-[1200px] lg:min-w-[1600px] sm:w-auto">
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
                      className="flex flex-col flex-shrink-0 items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[50px]"
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
                            className="absolute bottom-0 w-full bg-lishka-blue transition-all duration-300"
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
            <div className="flex gap-3 pb-2 min-w-[800px]">
              {weatherData.daily.time.slice(0, 7).map((time, index) => (
                <div
                  key={`day-${index}`}
                  className="flex flex-col flex-shrink-0 items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg w-[100px] sm:w-[120px]"
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
                    {getDailyWeatherIcon(
                      weatherData.daily.weather_code?.[index],
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
                        <Thermometer className="h-3 w-3 mr-1 text-lishka-blue" />
                        <p className="text-xs text-lishka-blue">
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
                      <Wind className="h-3 w-3 mr-1 text-lishka-blue" />
                      <p className="text-xs dark:text-gray-300 mr-1">
                        {(() => {
                          // Calculate the day's start and end indices in hourly data
                          const dayStart = index * 24;
                          const dayEnd = (index + 1) * 24;
                          // Get wind speeds for this day if available
                          const dayWindSpeeds =
                            weatherData?.hourly?.wind_speed_10m?.slice(
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
                              return formatSpeed(
                                useImperialUnits,
                                avgWindSpeed,
                              ).split(" ")[0];
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
                              dayEnd,
                            );
                          if (
                            dayWindDirections &&
                            dayWindDirections.length > 0
                          ) {
                            // Filter out null values
                            const validDirections = dayWindDirections.filter(
                              (d) => d !== null,
                            );
                            if (validDirections.length > 0) {
                              // Calculate average wind direction
                              const avgWindDirection =
                                validDirections.reduce(
                                  (sum, direction) => sum + direction,
                                  0,
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
                            dayEnd,
                          );
                        if (dayWindDirections && dayWindDirections.length > 0) {
                          // Filter out null values
                          const validDirections = dayWindDirections.filter(
                            (d) => d !== null,
                          );
                          if (validDirections.length > 0) {
                            // Calculate average wind direction
                            const avgWindDirection =
                              validDirections.reduce(
                                (sum, direction) => sum + direction,
                                0,
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
                      <Waves className="h-3 w-3 mr-1 text-lishka-blue" />
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
                              dayEnd,
                            );
                          if (
                            dayWaveDirections &&
                            dayWaveDirections.length > 0
                          ) {
                            // Filter out null values
                            const validDirections = dayWaveDirections.filter(
                              (d) => d !== null,
                            );
                            if (validDirections.length > 0) {
                              // Calculate average wave direction
                              const avgWaveDirection =
                                validDirections.reduce(
                                  (sum, direction) => sum + direction,
                                  0,
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
                            dayEnd,
                          );
                        if (dayWaveDirections && dayWaveDirections.length > 0) {
                          // Filter out null values
                          const validDirections = dayWaveDirections.filter(
                            (d) => d !== null,
                          );
                          if (validDirections.length > 0) {
                            // Calculate average wave direction
                            const avgWaveDirection =
                              validDirections.reduce(
                                (sum, direction) => sum + direction,
                                0,
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
                        <Sun className="h-3 w-3 mr-1 text-[#FFBF00]" />
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
      <div className="flex flex-col space-y-2 text-xs text-[#6B7280] p-3 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Data provided by Open-Meteo.com</span>
          </div>
          {lastUpdated && (
            <span>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
        }}
        onLocationSelect={() => {
          // onLocationChange(newLocation.name);
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
    </div>
  );
};

export default WeatherWidget;
