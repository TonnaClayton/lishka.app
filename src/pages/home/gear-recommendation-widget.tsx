import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, Waves, Loader2, AlertCircle } from "lucide-react";
import LoadingDots from "@/components/loading-dots";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { log } from "@/lib/logging";
import { config } from "@/lib/config";
import { useUserLocation } from "@/hooks/queries";

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
  gearId: string;
  score: number;
  reasoning: string;
  suitabilityForConditions: string;
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
  const [analysis, setAnalysis] = useState<AnalysisState>({
    phase: "idle",
    weatherConditions: null,
    recommendations: [],
    error: null,
  });

  // Get user gear directly from profile (no local state)
  const userGear =
    profile?.gear_items && Array.isArray(profile.gear_items)
      ? profile.gear_items
      : [];

  // Track previous location to detect changes
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  // Main analysis effect - handles both initial load and location changes
  useEffect(() => {
    if (!location) {
      log("[GearRecommendation] No location available, skipping analysis");
      return;
    }

    if (userGear.length === 0) {
      log("[GearRecommendation] No gear found, skipping analysis");
      return;
    }

    log("[GearRecommendation] Prerequisites met:", {
      hasLocation: !!location,
      gearCount: userGear.length,
      locationName: location.name,
      analysisPhase: analysis.phase,
    });

    const locationKey = `${location.latitude}-${location.longitude}-${location.name}`;
    const hasLocationChanged =
      previousLocation !== null && previousLocation !== locationKey;

    // If location changed, reset analysis first
    if (hasLocationChanged) {
      log("[GearRecommendation] Location changed, resetting analysis");
      setAnalysis({
        phase: "idle",
        weatherConditions: null,
        recommendations: [],
        error: null,
      });
    }

    // Update previous location
    setPreviousLocation(locationKey);

    // Start analysis if we're in idle state (either initial load or after reset)
    if (analysis.phase === "idle" || hasLocationChanged) {
      log("[GearRecommendation] Starting analysis sequence");
      // Use setTimeout to avoid immediate execution during state updates
      const timeoutId = setTimeout(() => {
        startAnalysis();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    location?.latitude,
    location?.longitude,
    location?.name,
    userGear.length,
    analysis.phase,
  ]);

  // Generate cache key for analysis results
  const getCacheKey = (
    location: { latitude: number; longitude: number; name: string },
    gearIds: string[]
  ) => {
    const locationKey = `${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}-${location.name}`;
    const gearKey = gearIds.sort().join(",");
    const dateKey = new Date().toISOString().split("T")[0]; // Cache per day
    return `gear_analysis_${locationKey}_${gearKey}_${dateKey}`;
  };

  // Load cached analysis
  const loadCachedAnalysis = (cacheKey: string): AnalysisState | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Check if cache is still valid (within 6 hours)
        const cacheTime = new Date(parsedCache.timestamp);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 6) {
          return parsedCache.analysis;
        }
      }
    } catch (error) {
      console.error("[GearRecommendation] Error loading cache:", error);
    }
    return null;
  };

  // Save analysis to cache
  const saveAnalysisToCache = (cacheKey: string, analysis: AnalysisState) => {
    try {
      const cacheData = {
        analysis,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("[GearRecommendation] Error saving cache:", error);
    }
  };

  // Main analysis function - sequential flow with caching
  const startAnalysis = async () => {
    if (!location || userGear.length === 0) return;

    const gearIds = userGear.map((gear) => gear.id);
    const cacheKey = getCacheKey(location, gearIds);

    // Try to load from cache first
    const cachedAnalysis = loadCachedAnalysis(cacheKey);
    if (cachedAnalysis) {
      setAnalysis(cachedAnalysis);
      return;
    }

    try {
      // Phase 1: Load weather data
      setAnalysis((prev) => ({
        ...prev,
        phase: "loading-weather",
        error: null,
      }));

      const weatherConditions = await fetchWeatherData();

      // Phase 2: Generate AI recommendations
      setAnalysis((prev) => ({
        ...prev,
        phase: "analyzing-gear",
        weatherConditions,
      }));

      const recommendations = await generateAIRecommendations(
        userGear,
        weatherConditions
      );

      // Phase 3: Complete
      const finalAnalysis = {
        phase: "complete" as const,
        weatherConditions,
        recommendations,
        error: null,
      };

      setAnalysis(finalAnalysis);

      // Save to cache
      saveAnalysisToCache(cacheKey, finalAnalysis);
    } catch (error) {
      console.error("[GearRecommendation] Analysis failed:", error);
      setAnalysis((prev) => ({
        ...prev,
        phase: "error",
        error: error instanceof Error ? error.message : "Analysis failed",
      }));
    }
  };

  // Fetch weather data from Open-Meteo API
  const fetchWeatherData = async (): Promise<WeatherConditions> => {
    if (!location) throw new Error("No location available");

    log(`[GearRecommendation] Fetching weather for: ${location.name}`);

    const weatherUrl = `https://customer-api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weathercode&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto&apikey=1g8vJZI7DhEIFDIt`;

    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${location.latitude}&longitude=${location.longitude}&current=wave_height,swell_wave_height,swell_wave_period`;

    try {
      const [weatherResponse, marineResponse] = await Promise.all([
        fetch(weatherUrl).catch(() => null),
        fetch(marineUrl).catch(() => null), // Marine data is optional
      ]);

      if (!weatherResponse || !weatherResponse.ok) {
        // Use fallback weather data
        return {
          temperature: 20,
          windSpeed: 5,
          windDirection: 180,
          waveHeight: 0.5,
          swellHeight: 0.3,
          swellPeriod: 8,
          weatherCondition: "Clear",
          isSeaLocation: true,
        };
      }

      const weatherData = await weatherResponse.json();
      const marineData = marineResponse ? await marineResponse.json() : null;

      // Extract current conditions
      const temperature =
        weatherData.current?.temperature_2m ||
        weatherData.hourly?.temperature_2m?.[0] ||
        20;
      const windSpeed =
        weatherData.current?.wind_speed_10m ||
        weatherData.hourly?.wind_speed_10m?.[0] ||
        5;
      const windDirection =
        weatherData.current?.wind_direction_10m ||
        weatherData.hourly?.wind_direction_10m?.[0] ||
        180;
      const waveHeight = marineData?.current?.wave_height || 0.5;
      const swellHeight = marineData?.current?.swell_wave_height || 0.3;
      const swellPeriod = marineData?.current?.swell_wave_period || 8;

      // Get weather condition
      const weatherCode = weatherData.current?.weather_code || 0;
      const weatherCondition = getWeatherCondition(weatherCode);

      return {
        temperature,
        windSpeed,
        windDirection,
        waveHeight,
        swellHeight,
        swellPeriod,
        weatherCondition,
        isSeaLocation: true,
      };
    } catch (error) {
      console.error("[GearRecommendation] Weather fetch failed:", error);

      // Return fallback conditions
      return {
        temperature: 20,
        windSpeed: 5,
        windDirection: 180,
        waveHeight: 0.5,
        swellHeight: 0.3,
        swellPeriod: 8,
        weatherCondition: "Clear",
        isSeaLocation: true,
      };
    }
  };

  // Generate AI recommendations
  const generateAIRecommendations = async (
    gear: GearItem[],
    conditions: WeatherConditions
  ): Promise<AIRecommendation[]> => {
    if (!config.VITE_OPENAI_API_KEY) {
      log("[GearRecommendation] No OpenAI API key available");
      return [];
    }

    const prompt = `You are an expert fishing guide AI. Analyze the user's gear collection and rank each item based on current weather and marine conditions.

Current Conditions:
- Temperature: ${Math.round(conditions.temperature)}°C
- Wind: ${Math.round(conditions.windSpeed)} km/h
- Wave Height: ${conditions.waveHeight.toFixed(1)}m
- Swell Height: ${conditions.swellHeight.toFixed(1)}m
- Swell Period: ${conditions.swellPeriod.toFixed(1)}s
- Weather: ${conditions.weatherCondition}

User's Gear Collection:
${gear
  .map(
    (item, index) =>
      `${index + 1}. ID: ${item.id} | Name: ${item.name} | Category: ${item.category} | Type: ${item.gearType || "Unknown"} | Target: ${item.targetFish || "Various"} | Depth: ${item.depthRange || "Any"}`
  )
  .join("\n")}

Provide recommendations in this EXACT JSON format:
{
  "recommendations": [
    {
      "gearId": "exact_gear_id_from_list",
      "score": 85,
      "reasoning": "Brief explanation why this gear suits current conditions",
      "suitabilityForConditions": "Perfect for current wave height and wind conditions"
    }
  ]
}

Rank ALL gear items (score 1-100) based on suitability for current surface conditions (temperature, wind, waves, weather). DO NOT make assumptions about water depth or bottom conditions. Focus on how surface conditions affect gear performance and fishing effectiveness. Use the EXACT gear IDs from the list above.`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const result = JSON.parse(jsonMatch[0]);
      const recommendations = result.recommendations || [];

      return recommendations;
    } catch (error) {
      console.error("[GearRecommendation] AI generation failed:", error);
      return [];
    }
  };

  // Get weather condition from WMO code
  const getWeatherCondition = (weatherCode: number): string => {
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
      case weatherCode >= 61 && weatherCode <= 65:
        return "Rain";
      case weatherCode >= 71 && weatherCode <= 77:
        return "Snow";
      case weatherCode >= 80 && weatherCode <= 82:
        return "Rain showers";
      case weatherCode >= 95 && weatherCode <= 99:
        return "Thunderstorm";
      default:
        return "Clear";
    }
  };

  // Get recommendation for specific gear
  const getRecommendation = (gearId: string): AIRecommendation | null => {
    return (
      analysis.recommendations.find((rec) => rec.gearId === gearId) || null
    );
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
      return recommendation.suitabilityForConditions;
    }

    // Only show if we have AI analysis complete, otherwise show waiting message
    if (analysis.phase === "complete") {
      return "Analyzing suitability for current conditions...";
    }

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
  const retryAnalysis = () => {
    setAnalysis({
      phase: "idle",
      weatherConditions: null,
      recommendations: [],
      error: null,
    });
  };

  // Handle gear click to navigate to gear category page
  const handleGearClick = (gear: GearItem) => {
    // Navigate to the gear category page with the specific gear ID as a query parameter
    navigate(`/gear-category/${gear.category}?gearId=${gear.id}`);
  };

  // Show empty state if no gear
  if (userGear.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="font-bold mb-1 text-black dark:text-white text-xl">
          AI Gear Recommendations
        </h2>
        <p className="text-sm mb-4 text-gray-600">
          Based on current conditions: Clear sky, 0.2m waves, 3km/h wind
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
              {analysis.phase === "complete" && analysis.weatherConditions
                ? `Based on current conditions: ${analysis.weatherConditions.weatherCondition}, ${analysis.weatherConditions.waveHeight.toFixed(1)}m waves, ${Math.round(analysis.weatherConditions.windSpeed)}km/h wind`
                : "Analyzing current conditions for personalized recommendations"}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {analysis.phase === "loading-weather" && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading weather...</span>
              </div>
            )}
            {analysis.phase === "error" && (
              <Button variant="outline" size="sm" onClick={retryAnalysis}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Content based on analysis phase */}
      {analysis.phase === "idle" ||
      analysis.phase === "loading-weather" ||
      analysis.phase === "analyzing-gear" ? (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingDots />
          <p className="text-sm text-muted-foreground mt-2">
            {analysis.phase === "loading-weather" &&
              "Loading weather conditions..."}
            {analysis.phase === "analyzing-gear" &&
              "AI is analyzing your gear..."}
            {analysis.phase === "idle" && "Preparing analysis..."}
          </p>
        </div>
      ) : analysis.phase === "error" ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Analysis failed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              {analysis.error}
            </p>
            <Button variant="outline" size="sm" onClick={retryAnalysis}>
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
      {analysis.phase === "complete" && userGear.length > 20 && (
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
