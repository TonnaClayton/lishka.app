import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Ship, Loader2 } from "lucide-react";
import { getDirectionArrow, getWindDirection } from "@/lib/weather-utils";

interface MarineCardProps {
  displayConditions: any;
  weatherData: any;
  getMarineAdvice: () => string;
  isLoadingRecommendation: boolean;
}

export const MarineCard: React.FC<MarineCardProps> = ({
  displayConditions,
  weatherData,
  getMarineAdvice,
  isLoadingRecommendation,
}) => {
  const getBadgeClassName = (condition: string) => {
    const baseClasses = "text-sm px-3 py-1";
    switch (condition) {
      case "Excellent":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`;
      case "Good":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`;
      case "Fair":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100`;
      case "Poor":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`;
      default:
        return baseClasses;
    }
  };

  return (
    <Card className="p-6 bg-[#1E40AF] border-none text-white overflow-hidden relative shadow-md mt-4 rounded-xl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium opacity-90">Marine Conditions</h2>
          <p className="text-sm opacity-80">Fishing Forecast</p>
        </div>
        <div className="p-2 bg-white/10 rounded-full">
          <Ship className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2">
          <Badge
            className={getBadgeClassName(displayConditions.fishingConditions)}
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
  );
};
