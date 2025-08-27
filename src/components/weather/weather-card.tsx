import React from "react";
import { Card } from "../ui/card";
import { Sun, Moon, Wind, Umbrella, Gauge } from "lucide-react";
import { formatTemperature } from "@/lib/unit-conversion";
import { getWeatherIcon } from "@/lib/weather-icons";

interface WeatherCardProps {
  weatherData: any;
  currentConditions: any;
  precipitationForecast: any;
  getWeatherCondition: () => string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weatherData,
  currentConditions,
  precipitationForecast,
  getWeatherCondition,
}) => {
  const getCurrentTemperature = () => {
    if (
      weatherData?.current?.temperature_2m !== undefined &&
      weatherData.current.temperature_2m !== null
    ) {
      return formatTemperature(weatherData.current.temperature_2m).split(
        " ",
      )[0];
    }
    if (currentConditions.temperature !== null) {
      return formatTemperature(currentConditions.temperature).split(" ")[0];
    }
    return "-";
  };

  const getFeelsLikeTemperature = () => {
    if (
      weatherData?.current?.apparent_temperature !== undefined &&
      weatherData.current.apparent_temperature !== null
    ) {
      return formatTemperature(weatherData.current.apparent_temperature).split(
        " ",
      )[0];
    }
    if (currentConditions.temperature !== null) {
      return formatTemperature(currentConditions.temperature).split(" ")[0];
    }
    return "-";
  };

  const getDailyRange = () => {
    if (
      weatherData?.daily?.temperature_2m_max &&
      weatherData?.daily?.temperature_2m_min &&
      weatherData.daily.temperature_2m_max[0] !== null &&
      weatherData.daily.temperature_2m_min[0] !== null
    ) {
      return `Today: ${formatTemperature(weatherData.daily.temperature_2m_min[0]).split(" ")[0]} to ${formatTemperature(weatherData.daily.temperature_2m_max[0]).split(" ")[0]}`;
    }
    return "Today: - to -";
  };

  return (
    <Card className="p-6 bg-gradient-to-br border-none from-[#0251FB] to-[#1E40AF] text-white overflow-hidden relative shadow-md rounded-xl">
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
          {getWeatherIcon(weatherData)}
        </div>
      </div>

      <div className="mt-6 mb-6">
        <div className="flex items-baseline">
          <span className="text-6xl font-bold">{getCurrentTemperature()}</span>
        </div>
        <p className="text-sm mt-2 opacity-90">
          Feels like {getFeelsLikeTemperature()}
          <br />
          {getDailyRange()}
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
              {!weatherData?.daily?.sunset || !weatherData.daily.sunset[0]
                ? "-"
                : new Date(weatherData.daily.sunset[0]).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
