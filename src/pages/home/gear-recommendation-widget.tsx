import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Package,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { useGetWeatherSummary } from "@/hooks/queries";
import { useGetGearRecommendation } from "@/hooks/queries/gear/use-gear-recommendation";
import { GearItem } from "@/lib/gear";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";
import { AIRecommendation } from "@/types/gear-recommendation";
import { Skeleton } from "@/components/ui/skeleton";

const tagGearBasedOnCategory = (category: string) => {
  switch (category) {
    case "lure":
      return ["spinning"];
    case "rod":
      return ["cast"];
    case "reel":
      return ["trolling"];
    default:
      return ["jigging"];
  }
};

const GearRecommendationWidget: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
      : undefined,
  );

  const userGear: GearItem[] =
    profile?.gear_items && Array.isArray(profile.gear_items)
      ? (profile.gear_items as unknown as GearItem[])
      : [];

  const recommendations = useMemo(() => {
    return [
      ...(gearRecommendation?.recommendations || []),
      ...(gearRecommendation?.alternativesIfNone || []),
    ];
  }, [gearRecommendation]);

  const tags = useMemo(() => {
    const gearTags = userGear
      .filter((i) => i.recommendation != undefined)
      .map((i) => i.recommendation.method_tags)
      .flat();

    const aiTags = recommendations?.map((rec) => rec.method_tags).flat() || [];

    return ["spinning", "jigging", "cast", "trolling", ...gearTags, ...aiTags];
  }, [recommendations, userGear]);

  const getRecommendation = useCallback(
    (gearId: string): AIRecommendation | null => {
      if (!recommendations) return null;
      return recommendations?.find((rec) => rec.gear_id === gearId) || null;
    },
    [recommendations],
  );

  const getSortedGear = useCallback((): GearItem[] => {
    let filteredGear = [...userGear];

    if (selectedTag) {
      filteredGear = filteredGear.filter((gear) => {
        const recommendation =
          gear.recommendation || getRecommendation(gear.id);
        return recommendation?.method_tags?.includes(selectedTag);
      });
    }

    // return filteredGear.sort((a: any, b: any) => {
    //   const scoreA = getRecommendation(a.id)?.score || 0;
    //   const scoreB = getRecommendation(b.id)?.score || 0;

    //   if (scoreA !== scoreB) return scoreB - scoreA;
    //   return a.name.localeCompare(b.name);
    // });
    return filteredGear;
  }, [userGear, selectedTag, getRecommendation]);

  const handleGearClick = (gear: GearItem) => {
    captureEvent("gear_recommendation_clicked", {
      gear_id: gear.id,
      gear_name: gear.name,
      gear_category: gear.category,
      weather_condition: weatherData?.condition,
      temperature: weatherData?.temperature,
      wind_speed: weatherData?.wind_speed,
    });

    navigate(`/gear-category/${gear.category}?gearId=${gear.id}`);
  };

  // if (isLoadingGearRecommendation || isRefetchingGearRecommendation) {
  //   return <GearRecommendationSkeleton />;
  // }

  if (userGear.length === 0) {
    return (
      <div className="mb-8 px-4 lg:px-6">
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
      <div className="mb-4 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
              AI Gear Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoadingGearRecommendation == false &&
              isErrorGearRecommendation == false &&
              weatherData
                ? `Based on current conditions: ${weatherData.condition}, ${weatherData.wave_height ? weatherData.wave_height.toFixed(1) : "0"}m waves, ${Math.round(weatherData.wind_speed)}km/h wind`
                : "Analyzing current conditions for personalized recommendations"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isLoadingGearRecommendation && (
              <div className="flex items-center gap-2 text-lishka-blue">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading weather...</span>
              </div>
            )}
            {isErrorGearRecommendation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  captureEvent("gear_recommendation_retry_clicked");
                  refetch();
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* isLoadingGearRecommendation || isRefetchingGearRecommendation ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 lg:px-6">
          <LoadingDots />
          <p className="text-sm text-muted-foreground mt-2">
            {isLoadingGearRecommendation && "Loading weather conditions..."}
            {isRefetchingGearRecommendation && "AI is analyzing your gear..."}
          </p>
        </div>
      )  */}

      {isErrorGearRecommendation ? (
        <div className="flex items-center justify-center py-12 px-4 lg:px-6">
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
        <div className="w-full">
          {tags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 -webkit-overflow-scrolling-touch px-4 lg:px-6">
              <Button
                type="button"
                className={cn(
                  "bg-[#191B1F0D] shadow-none text-sm font-medium text-[#65758B] hover:bg-black hover:text-white h-[36px] rounded-[30px] py-2 px-4 w-fit flex-shrink-0",
                  selectedTag === null && "bg-black text-white",
                )}
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {[...new Set(tags)].map((tag, index) => (
                <Button
                  key={index}
                  type="button"
                  className={cn(
                    "bg-[#191B1F0D] shadow-none text-sm font-medium text-[#65758B] hover:bg-black hover:text-white h-[36px] capitalize rounded-[30px] py-2 px-4 w-fit flex-shrink-0",
                    selectedTag === tag && "bg-black text-white",
                  )}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent px-4 lg:px-6 scrollbar-thumb-gray-300">
            {getSortedGear()
              .slice(0, 20)
              .map((gear, index) => {
                const recommendation =
                  gear.recommendation || getRecommendation(gear.id);
                const score = recommendation?.score || 0;

                const method_tags =
                  recommendation?.method_tags &&
                  recommendation.method_tags.length > 0
                    ? recommendation.method_tags
                    : tagGearBasedOnCategory(gear.category);

                return (
                  <div
                    key={index}
                    className="overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex-shrink-0 w-[320px] relative cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleGearClick(gear)}
                  >
                    {/* Gear Image */}
                    <div className="relative w-full aspect-square overflow-hidden">
                      {gear.imageUrl ? (
                        <img
                          src={gear.imageUrl}
                          alt={gear.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* AI Score Badge */}
                      {score > 0 && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">
                            {score}% Match
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Gear Info */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Gear Name */}
                      <div className="mb-4">
                        <h3 className="font-bold text-base text-foreground line-clamp-1">
                          {gear.name}
                        </h3>
                      </div>

                      {isLoadingGearRecommendation ||
                      isRefetchingGearRecommendation ? (
                        <div className="flex flex-col gap-2">
                          <Skeleton className="w-full h-[65px] rounded-lg" />
                          <div className="flex gap-2 items-center">
                            <Skeleton className="w-[56px] h-4 rounded-lg" />
                            <Skeleton className="w-[56px] h-4 rounded-lg" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* AI Reasoning - Only show if available */}
                          {recommendation?.reasoning && (
                            <div className="mb-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                  {recommendation.reasoning}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Spacer to push tags to bottom */}
                          <div className="flex-1" />

                          {/* Method Tags - Only show if available */}
                          {method_tags && method_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {method_tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md capitalize"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* No AI Data Available Message */}
                          {!recommendation && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic">
                                No AI analysis available for current conditions
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {isLoadingGearRecommendation == false &&
        isErrorGearRecommendation == false &&
        userGear.length > 20 && (
          <div className="mt-3 px-4 lg:px-6">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              +{userGear.length - 20} more gear items in your collection
            </p>
          </div>
        )}
    </div>
  );
};

export default GearRecommendationWidget;
