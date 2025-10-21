import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LocationData } from "./use-location-storage";
import { api } from "../api";

export interface CurrentConditions {
  temperature: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  waveHeight: number | null;
  swellWaveHeight: number | null;
  swellWavePeriod: number | null;
  weatherCondition: string;
}

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
  marineDataFromNearby?: boolean;
  marineCoordinates?: {
    latitude: number;
    longitude: number;
  };
  inshoreAdvice?: any;
  offshoreAdvice?: any;
}

export const weatherQueryKeys = {
  weatherData: (location: LocationData | null) =>
    [
      "weather",
      "data",
      location?.latitude || "null",
      location?.longitude || "null",
      location?.name || "null",
    ] as const,
  currentWeatherData: () => ["weather", "current"] as const,
  getWeatherSummary: (location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  }) => [
    "weather",
    "summary",
    location?.name,
    location?.latitude,
    location?.longitude,
  ],
};

// Function to fetch weather data from Open-Meteo API
const fetchWeatherData = async (
  lat?: number,
  lng?: number,
  name?: string,
): Promise<WeatherData> => {
  let path = "weather";

  let query = "";

  if (name) {
    query = `name=${name}`;
  }

  if (lat) {
    query = `latitude=${lat}`;
  }

  if (lng) {
    query = `longitude=${lng}`;
  }

  if (query) {
    path = `${path}?${query}`;
  }

  const data = await api<{
    data: WeatherData;
  }>(path, {
    method: "GET",
  });

  return data.data;
};

// Helper function to get weather condition name
export const getWeatherConditionName = (
  weatherCode: number | null | undefined,
) => {
  if (weatherCode === null || weatherCode === undefined) {
    return "Unknown";
  }

  // Modified WMO Weather interpretation codes to match Windy model
  switch (true) {
    case weatherCode === 0:
    case weatherCode === 1:
    case weatherCode === 2:
      return "Clear sky"; // Windy model: merge codes 0, 1, 2 into "Clear sky"
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
      return `Unknown (${weatherCode})`;
  }
};

// Hook for fetching weather data
export const useWeatherData = (location: LocationData | null) => {
  const queryClient = useQueryClient();

  const weatherQuery = useQuery({
    queryKey: weatherQueryKeys.weatherData(location),
    queryFn: async () => {
      if (!location || !location.latitude || !location.longitude) {
        throw new Error("No valid location available for weather data");
      }

      return fetchWeatherData(
        location.latitude,
        location.longitude,
        location.name,
      );
    },
    enabled: !!location && !!location.latitude && !!location.longitude,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for refreshing weather data
  const refreshWeatherMutation = useMutation({
    mutationFn: async () => {
      if (!location || !location.latitude || !location.longitude) {
        throw new Error("No valid location available for weather refresh");
      }
      return fetchWeatherData(
        location.latitude,
        location.longitude,
        location.name,
      );
    },
    onSuccess: (newWeatherData) => {
      // Update the weather data cache
      if (location) {
        queryClient.setQueryData(
          weatherQueryKeys.weatherData(location),
          newWeatherData,
        );
      }
    },
  });

  // Helper function to get weather condition
  const getWeatherCondition = (weatherData: WeatherData | null) => {
    if (!weatherData) return "-";

    // Use current weather code if available, otherwise use the first hourly code
    const weatherCode =
      weatherData.current?.weather_code ??
      (weatherData.hourly.weather_code &&
      weatherData.hourly.weather_code.length > 0
        ? weatherData.hourly.weather_code[0]
        : null);

    if (weatherCode === null) {
      return "-";
    }

    // Modified WMO Weather interpretation codes to match Windy model
    switch (true) {
      case weatherCode === 0:
      case weatherCode === 1:
      case weatherCode === 2:
        return "Clear sky"; // Windy model: merge codes 0, 1, 2 into "Clear sky"
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

  return {
    // Weather data state
    weatherData: weatherQuery.data,
    isLoading: weatherQuery.isLoading,
    error: weatherQuery.error,
    isError: weatherQuery.isError,

    // Refresh mutation
    refreshWeather: refreshWeatherMutation.mutate,
    refreshWeatherAsync: refreshWeatherMutation.mutateAsync,
    isRefreshing: refreshWeatherMutation.isPending,

    // Helper functions
    getWeatherCondition: () => getWeatherCondition(weatherQuery.data),

    // Query info
    isFetching: weatherQuery.isFetching,
    isStale: weatherQuery.isStale,
    lastUpdated: weatherQuery.dataUpdatedAt,
  };
};

// Weather summary data hook
export const useGetWeatherSummary = (location?: {
  latitude?: number;
  longitude?: number;
  name?: string;
}) => {
  return useQuery({
    queryKey: weatherQueryKeys.getWeatherSummary(location),
    queryFn: async () => {
      let path = "weather/summary";

      let query = "";

      if (location) {
        if (location.name) {
          query = `name=${location.name}`;
        }

        if (location.latitude) {
          query = `latitude=${location.latitude}`;
        }

        if (location.longitude) {
          query = `longitude=${location.longitude}`;
        }
      }

      if (query) {
        path = `${path}?${query}`;
      }

      const data = await api<{
        data: {
          temperature: number;
          condition: string;
          wind_speed: number;
          wave_height: number | null;
          is_sea_location?: boolean;
          wind_direction?: number | null;
          swell_wave_height?: number | null;
          swell_wave_period?: number | null;
          is_day?: boolean;
          is_night?: boolean;
        };
      }>(path, {
        method: "GET",
      });

      return data.data;
    },
    enabled: !!location,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
