import {
  Sun,
  Moon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudSnow,
  CloudRain,
  CloudHail,
  CloudLightning,
  CloudSun,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  current?: {
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    weather_code?: number[];
  };
}

export const getIconForWeatherCode = (
  weatherCode: number | null,
  size: "h-5 w-5" | "h-8 w-8",
  isDay: number = 1,
  useWhiteRain: boolean = false,
): JSX.Element => {
  if (weatherCode === null || weatherCode === undefined) {
    return <CloudSun className={cn(size, "text-gray-500")} />;
  }

  const rainColor = useWhiteRain ? "text-white" : "text-lishka-blue";

  switch (true) {
    case weatherCode === 0:
    case weatherCode === 1:
    case weatherCode === 2:
      return isDay ? (
        <Sun className={cn(size, "text-yellow-500")} />
      ) : (
        <Moon className={cn(size, "text-blue-200")} />
      );
    case weatherCode === 3:
      return <Cloud className={cn(size, "text-gray-500")} />;
    case weatherCode >= 45 && weatherCode <= 49:
      return <CloudFog className={cn(size, "text-gray-400")} />;
    case weatherCode >= 51 && weatherCode <= 55:
      return <CloudDrizzle className={cn(size, "text-blue-400")} />;
    case weatherCode >= 56 && weatherCode <= 57:
      return <CloudSnow className={cn(size, "text-blue-300")} />;
    case weatherCode >= 61 && weatherCode <= 65:
      return <CloudRain className={cn(size, rainColor)} />;
    case weatherCode >= 66 && weatherCode <= 67:
      return <CloudHail className={cn(size, "text-blue-300")} />;
    case weatherCode >= 71 && weatherCode <= 77:
      return <CloudSnow className={cn(size, "text-blue-200")} />;
    case weatherCode >= 80 && weatherCode <= 82:
      return useWhiteRain ? (
        <CloudRain className={cn(size, "text-blue-500")} />
      ) : (
        <CloudRain className={cn(size, rainColor)} />
      );
    case weatherCode >= 85 && weatherCode <= 86:
      return <CloudSnow className={cn(size, "text-blue-200")} />;
    case weatherCode >= 95 && weatherCode <= 99:
      return <CloudLightning className={cn(size, "text-yellow-500")} />;
    default:
      return <CloudSun className={cn(size, "text-gray-500")} />;
  }
};

export const getWeatherIcon = (
  weatherData?: WeatherData,
  index?: number,
): JSX.Element => {
  if (!weatherData) return <CloudSun className="h-8 w-8 text-gray-500" />;

  const weatherCode =
    // weatherData.current?.weather_code ??
    weatherData.hourly?.weather_code &&
    weatherData.hourly.weather_code.length > 0
      ? weatherData.hourly.weather_code[index ?? 0]
      : null;
  const isDay = weatherData.current?.is_day ?? 1;

  return getIconForWeatherCode(weatherCode, "h-8 w-8", isDay, true);
};

export const getDailyWeatherIcon = (weatherCode: number): JSX.Element => {
  return getIconForWeatherCode(weatherCode, "h-5 w-5");
};
