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

interface WeatherData {
  current?: {
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    weather_code?: number[];
  };
}

export const getWeatherIcon = (weatherData?: WeatherData): JSX.Element => {
  if (!weatherData) return <CloudSun className="h-8 w-8 text-gray-500" />;

  const weatherCode =
    weatherData.current?.weather_code ??
    (weatherData.hourly?.weather_code &&
    weatherData.hourly.weather_code.length > 0
      ? weatherData.hourly.weather_code[0]
      : null);
  const isDay = weatherData.current?.is_day ?? 1;

  if (weatherCode === null) {
    return <CloudSun className="h-8 w-8 text-gray-500" />;
  }

  switch (true) {
    case weatherCode === 0:
    case weatherCode === 1:
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

export const getDailyWeatherIcon = (weatherCode: number): JSX.Element => {
  if (weatherCode === null || weatherCode === undefined) {
    return <CloudSun className="h-5 w-5 text-gray-500" />;
  }

  switch (true) {
    case weatherCode === 0:
    case weatherCode === 1:
    case weatherCode === 2:
      return <Sun className="h-5 w-5 text-yellow-500" />;
    case weatherCode === 3:
      return <Cloud className="h-5 w-5 text-gray-500" />;
    case weatherCode >= 45 && weatherCode <= 49:
      return <CloudFog className="h-5 w-5 text-gray-400" />;
    case weatherCode >= 51 && weatherCode <= 55:
      return <CloudDrizzle className="h-5 w-5 text-blue-400" />;
    case weatherCode >= 56 && weatherCode <= 57:
      return <CloudSnow className="h-5 w-5 text-blue-300" />;
    case weatherCode >= 61 && weatherCode <= 65:
      return <CloudRain className="h-5 w-5 text-lishka-blue" />;
    case weatherCode >= 66 && weatherCode <= 67:
      return <CloudHail className="h-5 w-5 text-blue-300" />;
    case weatherCode >= 71 && weatherCode <= 77:
      return <CloudSnow className="h-5 w-5 text-blue-200" />;
    case weatherCode >= 80 && weatherCode <= 82:
      return <CloudRain className="h-5 w-5 text-lishka-blue" />;
    case weatherCode >= 85 && weatherCode <= 86:
      return <CloudSnow className="h-5 w-5 text-blue-200" />;
    case weatherCode >= 95 && weatherCode <= 99:
      return <CloudLightning className="h-5 w-5 text-yellow-500" />;
    default:
      return <CloudSun className="h-5 w-5 text-gray-500" />;
  }
};
