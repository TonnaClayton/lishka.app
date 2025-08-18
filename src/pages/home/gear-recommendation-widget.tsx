import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, Waves, Loader2, AlertCircle } from "lucide-react";
import LoadingDots from "@/components/loading-dots";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { log } from "@/lib/logging";
import { config } from "@/lib/config";
import { useGetWeatherSummary, useUserLocation } from "@/hooks/queries";
import GearRecommendationSkeleton from "./gear-recommendation-skeleton";
import { useGetGearRecommendation } from "@/hooks/queries/gear/use-gear-recommendation";

interface GearItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  model?: string;

  purchaseDate?: string;
  timestamp?: string;
  userConfirmed?: boolean;
  aiConfidence?: number;
  fishingTechnique?: string;
  targetFish?: string;
  depthRange?: string;
  size?: string;
  weight?: string;
  gearType?: string;
  weatherConditions?: string;
  waterConditions?: string;
  seasonalUsage?: string;
  colorPattern?: string;
  actionType?: string;
  versatility?: string;
  compatibleGear?: string;
}

interface WeatherConditions {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  swellHeight: number;
  swellPeriod: number;
  weatherCondition: string;
  isSeaLocation: boolean;
}

interface AIRecommendation {
  gear_id: string;
  score: number;
  reasoning: string;
  suitability_for_conditions: string;
}

interface AnalysisState {
  phase: "idle" | "loading-weather" | "analyzing-gear" | "complete" | "error";
  weatherConditions: WeatherConditions | null;
  recommendations: AIRecommendation[];
  error: string | null;
}

const GearRecommendationWidget: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { location } = useUserLocation();
  // const [analysis, setAnalysis] = useState<AnalysisState>({
  //   phase: "idle",
  //   weatherConditions: null,
  //   recommendations: [],
  //   error: null,
  // });
  const [isLoading, setIsLoading] = useState(false);

  const { data: weatherData } = useGetWeatherSummary();
  const {
    data: gearRecommendation,
    refetch,
    isLoading: isLoadingGearRecommendation,
    isError: isErrorGearRecommendation,
    error: gearRecommendationError,
    isRefetching: isRefetchingGearRecommendation,
  } = useGetGearRecommendation(
    weatherData
      ? {
          temperature: weatherData.temperature,
          wind_speed: weatherData.wind_speed,
          wave_height: weatherData.wave_height,
          swell_wave_height: weatherData.swell_wave_height,
          swell_wave_period: weatherData.swell_wave_period,
          weather_condition: weatherData.condition,
        }
      : undefined
  );

  // Get user gear directly from profile (no local state)
  const userGear =
    profile?.gear_items && Array.isArray(profile.gear_items)
      ? profile.gear_items
      : [];

  // Track previous location to detect changes

  // Load cached analysis

  // Main analysis function - sequential flow with caching

  // Get weather condition from WMO code
  // const getWeatherCondition = (weatherCode: number): string => {
  //   switch (true) {
  //     case weatherCode === 0:
  //       return "Clear sky";
  //     case weatherCode === 1:
  //       return "Mainly clear";
  //     case weatherCode === 2:
  //       return "Partly cloudy";
  //     case weatherCode === 3:
  //       return "Overcast";
  //     case weatherCode >= 45 && weatherCode <= 49:
  //       return "Fog";
  //     case weatherCode >= 51 && weatherCode <= 55:
  //       return "Drizzle";
  //     case weatherCode >= 61 && weatherCode <= 65:
  //       return "Rain";
  //     case weatherCode >= 71 && weatherCode <= 77:
  //       return "Snow";
  //     case weatherCode >= 80 && weatherCode <= 82:
  //       return "Rain showers";
  //     case weatherCode >= 95 && weatherCode <= 99:
  //       return "Thunderstorm";
  //     default:
  //       return "Clear";
  //   }
  // };

  // Get recommendation for specific gear
  const getRecommendation = (gearId: string): AIRecommendation | null => {
    return gearRecommendation?.find((rec) => rec.gear_id === gearId) || null;
  };

  // Get fishing technique for gear - prioritize AI data
  const getFishingTechnique = (gear: GearItem): string => {
    // Always prioritize AI-provided fishing technique
    if (gear.fishingTechnique) return gear.fishingTechnique;

    // Only show category as fallback if no AI data available
    return gear.category || "Fishing Gear";
  };

  // Get gear tip based on AI recommendation only
  const getGearTip = (gear: GearItem): string => {
    const recommendation = getRecommendation(gear.id);
    if (recommendation) {
      return recommendation.suitability_for_conditions;
    }

    // Only show if we have AI analysis complete, otherwise show waiting message
    // if (analysis.phase === "complete") {
    //   return "Analyzing suitability for current conditions...";
    // }

    return "Waiting for AI analysis...";
  };

  // Get depth range from gear AI data
  const getDepthRange = (gear: GearItem): string | null => {
    if (
      gear.depthRange &&
      gear.depthRange !== "Any" &&
      gear.depthRange !== "Unknown"
    ) {
      return gear.depthRange;
    }
    return null;
  };

  // Sort gear by AI scores
  const getSortedGear = (): GearItem[] => {
    return [...userGear].sort((a, b) => {
      const scoreA = getRecommendation(a.id)?.score || 0;
      const scoreB = getRecommendation(b.id)?.score || 0;

      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  };

  // Retry analysis
  // const retryAnalysis = () => {
  //   setAnalysis({
  //     phase: "idle",
  //     weatherConditions: null,
  //     recommendations: [],
  //     error: null,
  //   });
  // };

  // Handle gear click to navigate to gear category page
  const handleGearClick = (gear: GearItem) => {
    // Navigate to the gear category page with the specific gear ID as a query parameter
    navigate(`/gear-category/${gear.category}?gearId=${gear.id}`);
  };

  if (isLoading) {
    return <GearRecommendationSkeleton />;
  }

  // Show empty state if no gear
  if (userGear.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
          AI Gear Recommendations
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Personalized gear suggestions based on current conditions.
        </p>
        <div className="flex items-center justify-between py-8 bg-gray-50 dark:bg-gray-800 rounded-lg px-6">
          <div className="text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              No gear found in your profile
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Add gear in your profile to see personalised recommendations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile")}
            className="ml-4 flex-shrink-0"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
              AI Gear Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoadingGearRecommendation == false &&
              isErrorGearRecommendation == false &&
              weatherData
                ? `Based on current conditions: ${weatherData.condition}, ${weatherData.wave_height.toFixed(1)}m waves, ${Math.round(weatherData.wind_speed)}km/h wind`
                : "Analyzing current conditions for personalized recommendations"}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isLoadingGearRecommendation && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading weather...</span>
              </div>
            )}
            {isErrorGearRecommendation && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content based on analysis phase */}
      {isLoadingGearRecommendation || isRefetchingGearRecommendation ? (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingDots />
          <p className="text-sm text-muted-foreground mt-2">
            {isLoadingGearRecommendation && "Loading weather conditions..."}
            {isRefetchingGearRecommendation && "AI is analyzing your gear..."}
          </p>
        </div>
      ) : isErrorGearRecommendation ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Analysis failed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              {gearRecommendationError?.message}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        /* Show gear recommendations */
        <div className="w-full">
          <div
            className="flex gap-3 overflow-x-auto pb-4 -webkit-overflow-scrolling-touch px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {getSortedGear()
              .slice(0, 20)
              .map((gear, index) => {
                const recommendation = getRecommendation(gear.id);
                const score = recommendation?.score || null;
                const isTopRecommendation = score && score >= 80;

                return (
                  <div
                    key={`${gear.id}-${index}`}
                    className="overflow-hidden flex flex-col h-full border-0 shadow bg-white dark:bg-gray-800 rounded-xl flex-shrink-0 w-[280px] relative cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleGearClick(gear)}
                  >
                    {/* Gear Image */}
                    <div className="relative w-full aspect-[3/2] overflow-hidden max-w-full">
                      {gear.imageUrl ? (
                        <img
                          src={gear.imageUrl}
                          alt={gear.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Gear Info */}
                    <div className="p-2 sm:p-3 flex flex-col flex-1">
                      <div className="mb-1">
                        <h3 className="font-inter text-sm sm:text-base font-bold text-foreground line-clamp-1">
                          {gear.name}
                        </h3>
                      </div>

                      <div className="text-xs space-y-1 sm:space-y-1.5">
                        <div className="flex items-center">
                          <span className="text-foreground line-clamp-1 text-xs">
                            {getFishingTechnique(gear)}
                          </span>
                        </div>

                        <div className="flex items-start">
                          <span className="text-xs line-clamp-2 text-muted-foreground">
                            {getGearTip(gear)}
                          </span>
                        </div>

                        {/* Depth Range from AI */}
                        {getDepthRange(gear) && (
                          <div className="flex items-center">
                            <span className="text-foreground line-clamp-1 text-xs">
                              Use in depth: {getDepthRange(gear)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Show more indicator */}
      {isLoadingGearRecommendation == false &&
        isErrorGearRecommendation == false &&
        userGear.length > 20 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              +{userGear.length - 20} more gear items in your collection
            </p>
          </div>
        )}
    </div>
  );
};

export default GearRecommendationWidget;
