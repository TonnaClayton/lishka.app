import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import {
  Loader2,
  Waves,
  Wind,
  Droplets,
  Thermometer,
  Cloud,
  Umbrella,
  Sun,
} from "lucide-react";
import { log } from "@/lib/logging";

interface MarineData {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    temperature_2m: number[];
  };
  hourly_units: {
    wave_height: string;
    wind_speed_10m: string;
    temperature_2m: string;
  };
}

interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    cloudcover: number[];
    visibility: number[];
  };
  hourly_units: {
    temperature_2m: string;
    precipitation_probability: string;
    visibility: string;
  };
}

const WeatherWidgetSimplified: React.FC = () => {
  const [marineData, setMarineData] = useState<MarineData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch data from Open-Meteo API
  useEffect(() => {
    // Try to get user's location from localStorage
    const savedLocation = localStorage.getItem("userLocation");
    let latitude = 52.52;
    let longitude = 13.41;

    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        latitude = parsedLocation.latitude || parsedLocation.lat || latitude;
        longitude = parsedLocation.longitude || parsedLocation.lng || longitude;
        log(`Using user location: ${latitude}, ${longitude}`);
      } catch (err) {
        console.error("Error parsing user location:", err);
      }
    }

    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        log(`Fetching data for coordinates: ${latitude}, ${longitude}`);

        // Fetch marine data from Open-Meteo API
        const marineUrl = `https://customer-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_direction,wave_period,wind_speed_10m,wind_direction_10m,temperature_2m&apikey=1g8vJZI7DhEIFDIt`;

        // Fetch weather data from Open-Meteo API
        const weatherUrl = `https://customer-api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,weathercode,cloudcover,visibility&apikey=1g8vJZI7DhEIFDIt`;

        const [marineResponse, weatherResponse] = await Promise.all([
          fetch(marineUrl),
          fetch(weatherUrl),
        ]);

        // Continue even if marine API fails
        if (!marineResponse.ok) {
          console.error(`Marine API error: ${marineResponse.status}`);
        }

        if (!weatherResponse.ok) {
          throw new Error(`Weather API error: ${weatherResponse.status}`);
        }

        const marineData = await marineResponse.json();
        const weatherData = await weatherResponse.json();

        log("Marine data:", marineData);
        log("Weather data:", weatherData);

        setMarineData(marineData);
        setWeatherData(weatherData);
      } catch (err) {
        console.error("API fetch error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0251FB] night-mode:text-red-500 mb-4" />
        <p className="text-sm text-gray-600 night-mode:text-red-400">
          Loading weather data...
        </p>
      </div>
    );
  }

  if (error || (!marineData && !weatherData)) {
    return (
      <Card className="p-4 bg-red-50 night-mode:bg-nightMode-muted border-red-200 night-mode:border-red-900">
        <p className="text-red-600 night-mode:text-red-400 font-medium mb-2">
          Error: {error || "No weather data available"}
        </p>
        <div className="text-sm text-gray-700 night-mode:text-red-300 space-y-2">
          <p>This could be happening because:</p>
          <ul className="list-disc pl-5">
            <li>The Open-Meteo API may be temporarily unavailable</li>
            <li>
              Your location might be outside of the marine data coverage area
            </li>
            <li>
              There might be a CORS issue with the API in this environment
            </li>
          </ul>
          <p className="mt-3 text-xs">
            Try using a coastal location or check back later. The API works best
            with coastal coordinates.
          </p>
        </div>
      </Card>
    );
  }

  // Get marine data if available
  const marineAvailable = !!marineData;
  const weatherAvailable = !!weatherData;

  // Use marine data for times if available, otherwise use weather data
  const times = marineAvailable
    ? marineData.hourly.time.slice(currentIndex, currentIndex + 24)
    : weatherData.hourly.time.slice(currentIndex, currentIndex + 24);

  // Marine data
  const waveHeights = marineAvailable
    ? marineData.hourly.wave_height.slice(currentIndex, currentIndex + 24)
    : [];
  const waveDirections = marineAvailable
    ? marineData.hourly.wave_direction.slice(currentIndex, currentIndex + 24)
    : [];
  const wavePeriods = marineAvailable
    ? marineData.hourly.wave_period.slice(currentIndex, currentIndex + 24)
    : [];
  const windSpeeds = marineAvailable
    ? marineData.hourly.wind_speed_10m.slice(currentIndex, currentIndex + 24)
    : [];
  const windDirections = marineAvailable
    ? marineData.hourly.wind_direction_10m.slice(
        currentIndex,
        currentIndex + 24,
      )
    : [];
  const marineTemperatures = marineAvailable
    ? marineData.hourly.temperature_2m.slice(currentIndex, currentIndex + 24)
    : [];

  // Weather data
  const temperatures = weatherAvailable
    ? weatherData.hourly.temperature_2m.slice(currentIndex, currentIndex + 24)
    : marineTemperatures; // Fall back to marine temperatures if available
  const precipProbabilities = weatherAvailable
    ? weatherData.hourly.precipitation_probability.slice(
        currentIndex,
        currentIndex + 24,
      )
    : [];
  const weatherCodes = weatherAvailable
    ? weatherData.hourly.weathercode.slice(currentIndex, currentIndex + 24)
    : [];
  const cloudCover = weatherAvailable
    ? weatherData.hourly.cloudcover.slice(currentIndex, currentIndex + 24)
    : [];
  const visibility = weatherAvailable
    ? weatherData.hourly.visibility.slice(currentIndex, currentIndex + 24)
    : [];

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get wind direction as compass direction
  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Get weather description from code
  const getWeatherDescription = (code: number) => {
    // WMO Weather interpretation codes (WW)
    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow fall",
      73: "Moderate snow fall",
      75: "Heavy snow fall",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };
    return weatherCodes[code] || "Unknown";
  };

  // Calculate fishing conditions rating (simplified algorithm)
  const getFishingConditionsRating = (
    waveHeight: number = 0,
    windSpeed: number = 0,
    precipProbability: number = 0,
    weatherCode: number = 0,
  ) => {
    let score = 5; // Start with excellent

    // Marine factors
    if (marineAvailable) {
      // Wave height factor
      if (waveHeight > 2) score -= 3;
      else if (waveHeight > 1) score -= 2;
      else if (waveHeight > 0.5) score -= 1;

      // Wind speed factor
      if (windSpeed > 35) score -= 3;
      else if (windSpeed > 25) score -= 2;
      else if (windSpeed > 15) score -= 1;
    }

    // Weather factors
    if (weatherAvailable) {
      // Precipitation probability
      if (precipProbability > 80) score -= 2;
      else if (precipProbability > 50) score -= 1;

      // Weather code (storms, heavy rain are bad for fishing)
      if ([95, 96, 99].includes(weatherCode))
        score -= 3; // Thunderstorms
      else if ([65, 67, 75, 77, 82, 86].includes(weatherCode))
        score -= 2; // Heavy precipitation
      else if (
        [51, 53, 55, 56, 57, 61, 63, 71, 73, 80, 81, 85].includes(weatherCode)
      )
        score -= 1; // Light/moderate precipitation
    }

    // Convert score to rating
    if (score >= 4) return "Excellent";
    if (score >= 3) return "Good";
    if (score >= 2) return "Fair";
    return "Poor";
  };

  const currentConditions = {
    // Marine data
    waveHeight: marineAvailable ? waveHeights[0] : undefined,
    waveDirection: marineAvailable ? waveDirections[0] : undefined,
    wavePeriod: marineAvailable ? wavePeriods[0] : undefined,
    windSpeed: marineAvailable ? windSpeeds[0] : undefined,
    windDirection: marineAvailable ? windDirections[0] : undefined,

    // Weather data
    temperature: temperatures[0],
    precipProbability: weatherAvailable ? precipProbabilities[0] : undefined,
    weatherCode: weatherAvailable ? weatherCodes[0] : undefined,
    weatherDescription: weatherAvailable
      ? getWeatherDescription(weatherCodes[0])
      : undefined,
    cloudCover: weatherAvailable ? cloudCover[0] : undefined,
    visibility: weatherAvailable ? visibility[0] : undefined,

    // Combined rating
    fishingConditions: getFishingConditionsRating(
      marineAvailable ? waveHeights[0] : undefined,
      marineAvailable ? windSpeeds[0] : undefined,
      weatherAvailable ? precipProbabilities[0] : undefined,
      weatherAvailable ? weatherCodes[0] : undefined,
    ),
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white night-mode:bg-nightMode-background">
        <h2 className="text-xl font-semibold mb-4">
          Current Weather Conditions
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Weather data */}
          <div className="flex items-center">
            <Thermometer className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
            <div>
              <p className="text-sm text-gray-500 night-mode:text-red-400">
                Temperature
              </p>
              <p className="font-medium">
                {currentConditions.temperature}{" "}
                {weatherAvailable
                  ? weatherData.hourly_units.temperature_2m
                  : marineData.hourly_units.temperature_2m}
              </p>
            </div>
          </div>

          {weatherAvailable && (
            <div className="flex items-center">
              <Cloud className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
              <div>
                <p className="text-sm text-gray-500 night-mode:text-red-400">
                  Weather
                </p>
                <p className="font-medium">
                  {currentConditions.weatherDescription}
                </p>
              </div>
            </div>
          )}

          {weatherAvailable && (
            <div className="flex items-center">
              <Umbrella className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
              <div>
                <p className="text-sm text-gray-500 night-mode:text-red-400">
                  Precipitation
                </p>
                <p className="font-medium">
                  {currentConditions.precipProbability}
                  {weatherData.hourly_units.precipitation_probability}
                </p>
              </div>
            </div>
          )}

          {weatherAvailable && (
            <div className="flex items-center">
              <Sun className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
              <div>
                <p className="text-sm text-gray-500 night-mode:text-red-400">
                  Cloud Cover
                </p>
                <p className="font-medium">{currentConditions.cloudCover}%</p>
              </div>
            </div>
          )}
        </div>

        {marineAvailable && (
          <>
            <h2 className="text-xl font-semibold mb-4 mt-6">
              Marine Conditions
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Waves className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 night-mode:text-red-400">
                    Wave Height
                  </p>
                  <p className="font-medium">
                    {currentConditions.waveHeight}{" "}
                    {marineData.hourly_units.wave_height}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Wind className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 night-mode:text-red-400">
                    Wind
                  </p>
                  <p className="font-medium">
                    {currentConditions.windSpeed}{" "}
                    {marineData.hourly_units.wind_speed_10m}{" "}
                    {getWindDirection(currentConditions.windDirection)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Droplets className="h-5 w-5 mr-2 text-[#0251FB] night-mode:text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 night-mode:text-red-400">
                    Wave Period
                  </p>
                  <p className="font-medium">
                    {currentConditions.wavePeriod} s
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 p-3 bg-gray-50 night-mode:bg-nightMode-muted rounded-md">
          <p className="text-center font-medium">
            Fishing Conditions:
            <span
              className={`ml-2 ${
                currentConditions.fishingConditions === "Excellent"
                  ? "text-green-600 night-mode:text-green-400"
                  : currentConditions.fishingConditions === "Good"
                    ? "text-blue-600 night-mode:text-blue-400"
                    : currentConditions.fishingConditions === "Fair"
                      ? "text-yellow-600 night-mode:text-yellow-400"
                      : "text-red-600 night-mode:text-red-400"
              }`}
            >
              {currentConditions.fishingConditions}
            </span>
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-white night-mode:bg-nightMode-background">
        <h2 className="text-xl font-semibold mb-4">Forecast</h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-2">
            {times.slice(0, 8).map((time, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[70px]"
              >
                <p className="text-xs text-gray-500 night-mode:text-red-400">
                  {formatTime(time)}
                </p>
                <p className="text-sm font-medium">{temperatures[index]}°</p>

                {weatherAvailable && (
                  <p className="text-xs">{precipProbabilities[index]}% rain</p>
                )}

                {marineAvailable && (
                  <>
                    <p className="text-xs mt-1">{waveHeights[index]} m</p>
                    <p className="text-xs">
                      {windSpeeds[index]}{" "}
                      {marineData.hourly_units.wind_speed_10m}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeatherWidgetSimplified;
