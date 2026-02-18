import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, AlertCircle, MapPin, Flag } from "lucide-react";
import Lottie from "lottie-react";
import bookmarkAnimation from "@/assets/animations/bookmark-icon.json";
import BottomNav, { SideNav } from "@/components/bottom-nav";
import WeatherWidgetPro from "@/components/weather-widget-pro";
import { FishingGear, FishingSeasons } from "@/hooks/queries";
import {
  handleFishImageError,
  getPlaceholderFishImage,
  getFishImageUrl,
} from "@/lib/fish-image-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { error as logError } from "@/lib/logging";
import { useAuth } from "@/contexts/auth-context";
import FishDetailSkeleton from "./fish-detail-skeleton";
import { captureEvent } from "@/lib/posthog";
import { useStream } from "@/hooks/use-stream";
import { useReviewAccess } from "@/hooks/queries/fish/use-review-access";
import { FlagFishDialog } from "@/components/flag-fish-dialog";

// Fishing Season Calendar Component
interface FishingSeasonCalendarProps {
  fishingSeasons?: FishingSeasons;
  fishName: string;
  location?: string;
}

const FishingSeasonCalendar: React.FC<FishingSeasonCalendarProps> = ({
  fishingSeasons,
}) => {
  // Month data
  const months = [
    { short: "Jan", full: "January", index: 0 },
    { short: "Feb", full: "February", index: 1 },
    { short: "Mar", full: "March", index: 2 },
    { short: "Apr", full: "April", index: 3 },
    { short: "May", full: "May", index: 4 },
    { short: "Jun", full: "June", index: 5 },
    { short: "Jul", full: "July", index: 6 },
    { short: "Aug", full: "August", index: 7 },
    { short: "Sep", full: "September", index: 8 },
    { short: "Oct", full: "October", index: 9 },
    { short: "Nov", full: "November", index: 10 },
    { short: "Dec", full: "December", index: 11 },
  ];

  // Function to determine if a month is in season
  const isMonthInSeason = (monthData: {
    short: string;
    full: string;
    index: number;
  }): boolean => {
    if (!fishingSeasons?.inSeason || !Array.isArray(fishingSeasons.inSeason)) {
      return false;
    }

    // Convert all season entries to lowercase for comparison
    const seasonEntries = fishingSeasons.inSeason
      .map((season) =>
        typeof season === "string" ? season.toLowerCase().trim() : "",
      )
      .filter((season) => season.length > 0);

    // If no valid season entries, return false
    if (seasonEntries.length === 0) {
      return false;
    }

    // Check each season entry
    for (const season of seasonEntries) {
      // Direct match with full month name
      if (season === monthData.full.toLowerCase()) {
        return true;
      }

      // Direct match with short month name
      if (season === monthData.short.toLowerCase()) {
        return true;
      }

      // Check if season contains the month name (for entries like "spring", "summer", etc.)
      if (
        season.includes(monthData.full.toLowerCase()) ||
        season.includes(monthData.short.toLowerCase())
      ) {
        return true;
      }

      // Handle seasonal terms
      const seasonalMonths = {
        spring: [2, 3, 4], // March, April, May
        summer: [5, 6, 7], // June, July, August
        autumn: [8, 9, 10], // September, October, November
        fall: [8, 9, 10], // September, October, November
        winter: [11, 0, 1], // December, January, February
      };

      if (seasonalMonths[season]) {
        if (seasonalMonths[season].includes(monthData.index)) {
          return true;
        }
      }

      // Handle ranges like "January-March", "Jan-Mar", "March to June", etc.
      if (season.includes("-") || season.includes(" to ")) {
        const separator = season.includes("-") ? "-" : " to ";
        const [startSeason, endSeason] = season
          .split(separator)
          .map((s) => s.trim());

        // Find start and end month indices
        const startMonth = months.find(
          (m) =>
            m.full.toLowerCase() === startSeason ||
            m.short.toLowerCase() === startSeason ||
            m.full.toLowerCase().startsWith(startSeason) ||
            m.short.toLowerCase().startsWith(startSeason),
        );

        const endMonth = months.find(
          (m) =>
            m.full.toLowerCase() === endSeason ||
            m.short.toLowerCase() === endSeason ||
            m.full.toLowerCase().startsWith(endSeason) ||
            m.short.toLowerCase().startsWith(endSeason),
        );

        if (startMonth && endMonth) {
          const startIdx = startMonth.index;
          const endIdx = endMonth.index;
          const currentIdx = monthData.index;

          // Handle range that wraps around the year (e.g., Nov-Feb)
          let inRange = false;
          if (startIdx <= endIdx) {
            // Normal range (e.g., Mar-Jun)
            inRange = currentIdx >= startIdx && currentIdx <= endIdx;
          } else {
            // Wrapping range (e.g., Nov-Feb)
            inRange = currentIdx >= startIdx || currentIdx <= endIdx;
          }

          if (inRange) {
            return true;
          }
        }
      }

      // Handle comma-separated lists like "March, April, May"
      if (season.includes(",")) {
        const monthList = season.split(",").map((m) => m.trim());
        for (const monthName of monthList) {
          if (
            monthName === monthData.full.toLowerCase() ||
            monthName === monthData.short.toLowerCase() ||
            monthData.full.toLowerCase().startsWith(monthName) ||
            monthData.short.toLowerCase().startsWith(monthName)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Function to get month styling
  const getMonthStyling = (monthData: {
    short: string;
    full: string;
    index: number;
  }): string => {
    const isInSeason = isMonthInSeason(monthData);

    if (isInSeason) {
      // In season - light blue
      return "bg-blue-100 border-blue-200 text-lishka-blue /20 dark:border-blue-800 ";
    } else {
      // Not in season - light gray
      return "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-12 gap-0.5 sm:gap-1 text-center">
      {months.map((monthData) => {
        const styling = getMonthStyling(monthData);

        return (
          <div
            key={monthData.short}
            className={`py-1 sm:py-2 px-0.5 sm:px-1 rounded-md border text-[10px] ${styling}`}
          >
            {monthData.short}
          </div>
        );
      })}
    </div>
  );
};

const FishDetailPage = () => {
  const navigate = useNavigate();
  const { profile, loading: isProfileLoading } = useAuth();
  const { fishName } = useParams<{ fishName: string }>();

  // Curator review access
  const { data: reviewAccess } = useReviewAccess();
  const canReview = reviewAccess?.canReview ?? false;
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);

  const [fishImageUrl, setFishImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);

  // Streaming state management
  const [streamingStatus, setStreamingStatus] = useState<string>("");
  const [fishBasicData, setFishBasicData] = useState<any>(null);
  const [fishingInfoAccumulator, setFishingInfoAccumulator] =
    useState<string>("");
  const [regulationsAccumulator, setRegulationsAccumulator] =
    useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Ref to track the current fish name and prevent race conditions
  const currentFishNameRef = useRef<string | undefined>(undefined);
  const streamCompleteRef = useRef<boolean>(false);

  // Commenting out the traditional query hook since we're using streaming
  // const {
  //   data: fishDetailsData,
  //   isLoading: isFishDetailsLoading,
  //   isError: isFishDetailError,
  //   error: fishDetailError,
  // } = useFishDetails(fishName);

  // Use streaming data as the only source
  const displayData = fishBasicData;
  const isLoadingData = (isStreaming || isProfileLoading) && !fishBasicData;

  const streamBufferRef = useRef<string>("");

  // Memoize callbacks to prevent useStream from recreating startStream/stopStream
  const handleStreamData = React.useCallback((chunk: string) => {
    if (!chunk) return;

    try {
      streamBufferRef.current += chunk;

      // Split by newlines - backend sends newline-delimited JSON
      const lines = streamBufferRef.current.split("\n");

      // Keep the last line in the buffer if it's incomplete (doesn't end with \n)
      if (!streamBufferRef.current.endsWith("\n")) {
        streamBufferRef.current = lines.pop() ?? "";
      } else {
        streamBufferRef.current = "";
      }

      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) {
          continue;
        }

        // Check if this is SSE format (data: prefix) or raw JSON
        let jsonData = line.trim();
        if (line.startsWith("data:")) {
          jsonData = line.replace(/^data:\s?/, "").trim();
        }

        if (!jsonData) {
          continue;
        }

        const eventData = JSON.parse(jsonData);

        switch (eventData.type) {
          case "status":
            setStreamingStatus(eventData.message);
            break;

          case "fish_basic":
            setFishBasicData(eventData.data);
            setStreamingStatus("");
            break;

          case "fishing_info_chunk":
            // Accumulate fishing info chunks
            setFishingInfoAccumulator((prev) => prev + eventData.chunk);
            break;

          case "fishing_info":
            // Update fish basic data with complete fishing info
            // Preserve name, scientific_name, and description from original data
            // These should come from database, not AI-generated content
            setFishBasicData((prev: any) => {
              if (!prev) return eventData.data;

              return {
                ...prev,
                ...eventData.data,
                // Preserve these fields from original data to prevent flicker
                name: prev.name,
                scientific_name: prev.scientific_name,
                // Only update description if it wasn't in original data
                description: prev.description || eventData.data.description,
              };
            });
            // Clear accumulator
            setFishingInfoAccumulator("");
            break;

          case "regulations_chunk":
            // Accumulate regulations chunks
            setRegulationsAccumulator((prev) => prev + eventData.chunk);
            break;

          case "regulations":
            // Update fish data with regulations
            setFishBasicData((prev: any) => ({
              ...prev,
              fishing_regulations: eventData.data,
            }));
            // Clear accumulator
            setRegulationsAccumulator("");
            break;

          case "complete":
            if (eventData.data) {
              // Preserve name, scientific_name, and description from original fish_basic data
              // to prevent flicker - these should come from database, not AI
              setFishBasicData((prev: any) => {
                if (!prev) return eventData.data;

                return {
                  ...eventData.data,
                  // Preserve these fields from original data
                  name: prev.name || eventData.data.name,
                  scientific_name:
                    prev.scientific_name || eventData.data.scientific_name,
                  description: prev.description || eventData.data.description,
                };
              });
              streamCompleteRef.current = true;
            } else {
              logError(
                "[STREAM] Complete event has no data! Keeping existing data.",
              );
            }
            setStreamComplete(true);
            setIsStreaming(false);
            setStreamingStatus("");
            break;

          default:
            break;
        }
      }
    } catch (error) {
      logError("[STREAM] Error parsing chunk:", error, chunk);
    }
  }, []);

  const handleStreamError = React.useCallback((error: Error) => {
    logError("[STREAM] Stream error:", error);
    setIsStreaming(false);
    setStreamingStatus("");
  }, []);

  const handleStreamComplete = React.useCallback(() => {
    // Don't set isStreaming to false here immediately
    // The stream close is called even after successful data delivery
    // Let the data presence determine the loading state
  }, []);

  const { startStream, stopStream } = useStream({
    path: `fish/${fishName}/stream`,
    onData: handleStreamData,
    onError: handleStreamError,
    onComplete: handleStreamComplete,
  });

  // Track fish detail page view
  useEffect(() => {
    if (displayData && fishName && streamComplete) {
      captureEvent("fish_detail_viewed", {
        fish_name: fishName,
        scientific_name: displayData.scientific_name,
        is_toxic: displayData.is_toxic,
        habitat: displayData.habitat,
        difficulty: displayData.difficulty,
      });
    }
  }, [displayData, fishName, streamComplete]);

  useEffect(() => {
    if (fishName) {
      // Only start a new stream if the fish name has actually changed
      if (currentFishNameRef.current === fishName) {
        return;
      }

      currentFishNameRef.current = fishName;
      streamCompleteRef.current = false;

      setIsStreaming(true);
      setStreamComplete(false);
      setFishBasicData(null);
      setStreamingStatus("");
      setFishingInfoAccumulator("");
      setRegulationsAccumulator("");
      setHasAttemptedLoad(true);

      startStream({
        path: `fish/${fishName}/stream`,
      });
    }

    return () => {
      stopStream();
    };
  }, [fishName, startStream, stopStream]);

  useEffect(() => {
    const loadFishImage = async () => {
      if (!displayData?.name) return;

      try {
        setImageLoading(true);
        const fishImageUrl = await getFishImageUrl(
          displayData.name,
          displayData.scientific_name,
        );
        setFishImageUrl(fishImageUrl);
      } catch (error) {
        logError(`Error loading image for ${displayData.name}:`, error);
        setFishImageUrl(getPlaceholderFishImage());
      } finally {
        setImageLoading(false);
      }
    };

    // Only load if we don't already have a good image URL
    if (!displayData) return;
    if (
      !displayData.image ||
      displayData.image.includes("unsplash") ||
      displayData.image.includes("placeholder")
    ) {
      loadFishImage();
    } else {
      setFishImageUrl(displayData.image);
      setImageLoading(false);
    }
  }, [displayData, fishName]);

  if (isLoadingData) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">
              Loading...
            </h1>
          </div>
        </header>
        <div className="flex-1 flex h-full">
          {/* Desktop Side Navigation */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Fish Details Content */}
            <div className="flex-1 h-full overflow-y-auto">
              {/* Desktop Header */}
              {/* <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  {fishDetailsData.name}
                </h1>
              </div>
            </div> */}

              <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <h1 className="text-xl font-bold ml-2 dark:text-white">
                    Loading...
                  </h1>
                </div>
              </div>

              <FishDetailSkeleton />
            </div>

            {/* Weather Widget - Desktop only */}
            <div className="hidden lg:block lg:w-[380px] lg:flex-none bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto">
              <div className="h-full overflow-y-auto">
                <WeatherWidgetPro />
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Navigation - Mobile only */}
        <BottomNav />
      </div>
    );
  }

  // Only show error if we've attempted to load but have no data and aren't currently loading
  if (!displayData && !isStreaming && !isProfileLoading && hasAttemptedLoad) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">Error</h1>
          </div>
        </header>

        <div className="flex-1 flex h-full">
          {/* Desktop Side Navigation */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2 dark:text-white">
                  Error
                </h1>
              </div>
            </div>
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load fish details. Please try again.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate(-1)} className="mt-4">
                Go Back
              </Button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full lg:hidden border-b border-[#e8e8e9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold ml-2 dark:text-white">
              {displayData?.name || "Fish Details"}
            </h1>
          </div>
          {canReview && displayData?.id && (
            <button
              type="button"
              onClick={() => setFlagDialogOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={
                displayData?.flagged_for_review
                  ? "Remove investigation flag"
                  : "Flag for investigation"
              }
            >
              <Flag
                className={`h-5 w-5 ${
                  displayData?.flagged_for_review
                    ? "text-amber-500 fill-amber-500"
                    : "text-gray-400"
                }`}
              />
            </button>
          )}
        </div>
      </header>
      <div className="flex-1 flex h-full">
        {/* Desktop Side Navigation */}
        <div className="hidden lg:block">
          <SideNav />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Fish Details Content */}
          <div className="flex-1 h-full overflow-y-auto">
            {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <h1 className="text-xl font-bold ml-2 dark:text-white">
                    {displayData?.name || "Fish Details"}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {streamingStatus && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                      {streamingStatus}
                    </div>
                  )}
                  {canReview && displayData?.id && (
                    <button
                      type="button"
                      onClick={() => setFlagDialogOpen(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label={
                        displayData?.flagged_for_review
                          ? "Remove investigation flag"
                          : "Flag for investigation"
                      }
                    >
                      <Flag
                        className={`h-5 w-5 ${
                          displayData?.flagged_for_review
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
              {/* Fish Image Card */}
              <Card className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
                  {imageLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="text-gray-400">Loading image...</div>
                    </div>
                  ) : (
                    <img
                      src={
                        fishImageUrl ||
                        displayData?.image ||
                        getPlaceholderFishImage()
                      }
                      alt={displayData?.name || "Fish"}
                      className="w-full h-full object-cover absolute top-0 left-0"
                      onError={(e) => {
                        handleFishImageError(e, displayData?.name || "fish");
                      }}
                    />
                  )}
                  {/* Toxic label for toxic fish */}
                  {displayData?.is_toxic && (
                    <div className="absolute bottom-4 right-4 bg-red-600 px-3 py-1 rounded-3xl text-xs font-medium text-white z-10">
                      TOXIC
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h1 className="font-semibold text-xl text-white">
                      {displayData?.name || "Loading..."}
                    </h1>
                    <p className="text-white/80 text-xs italic">
                      {displayData?.scientific_name || ""}
                    </p>
                    <p className="text-white/80 text-[8px] leading-[100%] italic">
                      Our AI-created images give a close reference but may
                      differ from real life.
                    </p>
                  </div>
                  <div className="absolute -bottom-4 left-0 right-0 h-4 bg-red-600"></div>
                </div>
              </Card>

              {/* Toxicity Information Card - Only visible for toxic fish */}
              {displayData?.is_toxic && (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Toxicity Information
                  </h2>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {displayData?.danger_type ||
                        "This fish poses potential health risks. Exercise extreme caution when handling."}
                    </p>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        Safe Handling
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Always wear protective gloves, avoid contact with spines
                        or secretions, use tools to remove hooks, and wash hands
                        thoroughly after contact.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        If Injured
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Rinse wound with hot water, apply pressure to control
                        bleeding, and seek immediate medical attention. Call
                        emergency services if symptoms are severe.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Description Card */}
              <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  About this Fish
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {displayData?.description || "Loading description..."}
                </p>
              </Card>

              {/* Conservation Banner */}
              <div className="relative overflow-hidden rounded-xl">
                <div
                  className="relative bg-cover bg-center bg-no-repeat p-6 rounded-xl"
                  style={{
                    backgroundImage:
                      "url('/images/clayton-tonna-qINZ8zEYErY-unsplash (2).jpg')",
                  }}
                >
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/30 rounded-xl"></div>

                  {/* Content */}
                  <div className="relative flex flex-col gap-2">
                    {/* Title - On its own line */}
                    <h2 className="text-white text-left font-bold font-inter text-[28px] leading-[34px]">
                      Respect the ocean.
                    </h2>

                    {/* Subtitle and Logo grouped together */}
                    <div className="flex flex-row justify-between items-end gap-10">
                      <p
                        className="text-white text-left"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontStyle: "normal",
                          fontWeight: 700,
                          fontSize: "clamp(14px, 3.5vw, 16px)",
                          lineHeight: "clamp(18px, 4.5vw, 20px)",
                        }}
                      >
                        Catch & release{" "}
                        <span style={{ fontWeight: 400 }}>
                          when you can & take only what you truly need.
                        </span>
                      </p>

                      {/* Logo - 20px height */}
                      <div className="flex-shrink-0">
                        <img
                          src="/images/Lishka Tips.svg"
                          alt="Lishka Tips"
                          style={{ height: "20px", width: "auto" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Months Calendar Card */}
              <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Active Months
                  </h2>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    {displayData?.fishing_location ||
                      profile?.location ||
                      "Location not specified"}
                    <MapPin size={16} className="w-4 h-4 ml-1" />
                  </div>
                </div>
                {displayData?.fishing_seasons ? (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Best months to catch {displayData?.name} in{" "}
                      {displayData?.fishing_location ||
                        profile?.location ||
                        "your area"}
                      :
                    </div>
                    <FishingSeasonCalendar
                      fishingSeasons={displayData.fishing_seasons}
                      fishName={displayData.name}
                      location={
                        displayData.fishing_location || profile?.location
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    {fishingInfoAccumulator && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                        Fetching seasonal information...
                      </div>
                    )}
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="grid grid-cols-12 gap-0.5 sm:gap-1">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="h-8 bg-gray-200 dark:bg-gray-700 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* All Round Gear Card */}
              {displayData?.all_round_gear ? (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    All Round Gear
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {displayData.all_round_gear.rods && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Rods
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {displayData.all_round_gear.rods}
                        </div>
                      </div>
                    )}
                    {displayData.all_round_gear.reels && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Reels
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {displayData.all_round_gear.reels}
                        </div>
                      </div>
                    )}
                    {displayData.all_round_gear.line && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Line
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {displayData.all_round_gear.line}
                        </div>
                      </div>
                    )}
                    {displayData.all_round_gear.leader && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Leader
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {displayData.all_round_gear.leader}
                        </div>
                      </div>
                    )}
                  </div>
                  {displayData.all_round_gear.description && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {displayData.all_round_gear.description}
                      </p>
                    </div>
                  )}
                </Card>
              ) : fishingInfoAccumulator ? (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    All Round Gear
                  </h2>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                    Fetching gear information...
                  </div>
                  <div className="animate-pulse space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"
                        ></div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : null}

              {/* Fishing Methods */}
              {displayData?.fishing_methods &&
              displayData.fishing_methods.length > 0 ? (
                <>
                  {displayData.fishing_methods.map(
                    (method: any, index: number) => {
                      // Safety check for method object
                      if (!method || typeof method !== "object") {
                        return null;
                      }

                      // Helper functions to check gear availability and validity
                      const hasBait =
                        method.gear?.bait &&
                        Array.isArray(method.gear.bait) &&
                        method.gear.bait.length > 0 &&
                        method.gear.bait.some(
                          (b) =>
                            b &&
                            typeof b === "string" &&
                            b.trim() !== "" &&
                            b.trim().toLowerCase() !== "n/a",
                        );
                      const hasLures =
                        method.gear?.lures &&
                        Array.isArray(method.gear.lures) &&
                        method.gear.lures.length > 0 &&
                        method.gear.lures.some(
                          (l) =>
                            l &&
                            typeof l === "string" &&
                            l.trim() !== "" &&
                            l.trim().toLowerCase() !== "n/a",
                        );
                      // const hasJigInfo =
                      //   (method.gear?.jig_weight &&
                      //     typeof method.gear.jig_weight === "string" &&
                      //     method.gear.jig_weight.trim() !== "") ||
                      //   (method.gear?.jig_size &&
                      //     typeof method.gear.jig_size === "string" &&
                      //     method.gear.jig_size.trim() !== "");
                      const methodTitle =
                        method.title || method.method || `Method ${index + 1}`;
                      // const isJiggingMethod = methodTitle
                      //   .toLowerCase()
                      //   .includes("jig");
                      // const isBottomMethod = methodTitle
                      //   .toLowerCase()
                      //   .includes("bottom");
                      // const isTrollingMethod = methodTitle
                      //   .toLowerCase()
                      //   .includes("troll");

                      // Helper function to render gear information
                      const renderGearInfo = (gear: FishingGear) => {
                        const gearItems = [];

                        // Define all possible gear fields with their display names
                        const gearFields = [
                          { key: "depth", label: "Depth", color: "blue" },
                          {
                            key: "rods",
                            label: "Rod Specifications",
                            color: "green",
                          },
                          { key: "rodType", label: "Rod Type", color: "green" },
                          {
                            key: "reels",
                            label: "Reel Specifications",
                            color: "purple",
                          },
                          {
                            key: "reelType",
                            label: "Reel Type",
                            color: "purple",
                          },
                          { key: "line", label: "Line", color: "orange" },
                          { key: "leader", label: "Leader", color: "pink" },
                          {
                            key: "jigType",
                            label: "Jig Type",
                            color: "indigo",
                          },
                          {
                            key: "jigWeight",
                            label: "Jig Weight",
                            color: "red",
                          },
                          {
                            key: "jigColor",
                            label: "Jig Color",
                            color: "yellow",
                          },
                          {
                            key: "jiggingStyle",
                            label: "Jigging Style",
                            color: "teal",
                          },
                          {
                            key: "hookSize",
                            label: "Hook Size",
                            color: "cyan",
                          },
                          { key: "rigType", label: "Rig Type", color: "lime" },
                          { key: "weight", label: "Weight", color: "amber" },
                          {
                            key: "lureType",
                            label: "Lure Type",
                            color: "emerald",
                          },
                          {
                            key: "lureSize",
                            label: "Lure Size",
                            color: "violet",
                          },
                          {
                            key: "lureColor",
                            label: "Lure Color",
                            color: "rose",
                          },
                          {
                            key: "lureWeight",
                            label: "Lure Weight",
                            color: "sky",
                          },
                          {
                            key: "trollingSpeed",
                            label: "Trolling Speed",
                            color: "slate",
                          },
                          {
                            key: "trollingDistance",
                            label: "Trolling Distance",
                            color: "indigo",
                          },
                          {
                            key: "floatType",
                            label: "Float Type",
                            color: "zinc",
                          },
                          {
                            key: "castingDistance",
                            label: "Casting Distance",
                            color: "stone",
                          },
                          {
                            key: "electricReel",
                            label: "Electric Reel",
                            color: "neutral",
                          },
                          {
                            key: "lightAttractors",
                            label: "Light Attractors",
                            color: "gray",
                          },
                          { key: "speed", label: "Speed", color: "blue" },
                          { key: "hooks", label: "Hooks", color: "green" },
                          {
                            key: "hook_size_range",
                            label: "Hook Size Range",
                            color: "purple",
                          },
                          {
                            key: "structure",
                            label: "Structure",
                            color: "orange",
                          },
                          {
                            key: "sonarTips",
                            label: "Sonar Tips",
                            color: "pink",
                          },
                          {
                            key: "jigging_technique",
                            label: "Jigging Technique",
                            color: "indigo",
                          },
                          {
                            key: "technical_details",
                            label: "Technical Details",
                            color: "red",
                          },
                        ];

                        // Add bait and lures arrays
                        if (hasBait && Array.isArray(method.gear.bait)) {
                          gearItems.push({
                            label: "Bait",
                            value: method.gear.bait
                              .filter(
                                (b) =>
                                  b &&
                                  typeof b === "string" &&
                                  b.trim() !== "" &&
                                  b.trim().toLowerCase() !== "n/a",
                              )
                              .join(", "),
                            color: "emerald",
                          });
                        }

                        if (hasLures && Array.isArray(method.gear.lures)) {
                          gearItems.push({
                            label: "Lures",
                            value: method.gear.lures
                              .filter(
                                (l) =>
                                  l &&
                                  typeof l === "string" &&
                                  l.trim() !== "" &&
                                  l.trim().toLowerCase() !== "n/a",
                              )
                              .join(", "),
                            color: "violet",
                          });
                        }

                        // Add other gear fields
                        gearFields.forEach((field) => {
                          const value = gear[field.key];
                          if (
                            value &&
                            typeof value === "string" &&
                            value.trim() !== ""
                          ) {
                            gearItems.push({
                              label: field.label,
                              value: value,
                              color: field.color,
                            });
                          }
                        });

                        return gearItems;
                      };

                      const gearInfo = method.gear
                        ? renderGearInfo(method.gear)
                        : [];

                      return (
                        <Card
                          key={index}
                          className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-6"
                        >
                          <div className="space-y-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {methodTitle}
                              </h2>
                              {method.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {method.description}
                                </p>
                              )}
                            </div>

                            {/* Gear Information Grid */}
                            {gearInfo.length > 0 && (
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                                  Gear & Equipment
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                  {gearInfo.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                                    >
                                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                        {item.label}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-300">
                                        {item.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pro Tip */}
                            {method.proTip && (
                              <div
                                className="relative overflow-hidden border p-5 rounded-xl"
                                style={{ backgroundColor: "#0251FB" }}
                              >
                                {/* Decorative corner accent */}
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full"></div>

                                <div className="relative flex gap-3">
                                  {/* Icon */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-8 h-8">
                                      <Lottie
                                        animationData={bookmarkAnimation}
                                        loop={true}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1">
                                    <h4 className="font-bold text-base text-white mb-0.5">
                                      Pro Tip
                                    </h4>
                                    <p className="text-sm text-white/95 leading-relaxed">
                                      {method.proTip}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    },
                  )}
                </>
              ) : fishingInfoAccumulator || !streamComplete ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Card
                      key={i}
                      className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-6"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                          </div>
                          {i === 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                              Loading methods...
                            </div>
                          )}
                        </div>
                        <div className="animate-pulse space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, j) => (
                              <div
                                key={j}
                                className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              ) : streamComplete ? (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No fishing methods available for this fish.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      This might be due to API response issues or the fish not
                      being commonly targeted.
                    </p>
                  </div>
                </Card>
              ) : null}

              {/* Fishing Regulations Card - Moved to last position */}
              {displayData?.fishing_regulations ? (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Fishing Regulations
                    </h2>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      {displayData.fishing_location ||
                        profile?.location ||
                        "Location not specified"}
                      <MapPin size={16} className="w-4 h-4 ml-1" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Size Limit */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Size Limit
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {displayData.fishing_regulations.sizeLimit.value}
                        </span>
                        {displayData.fishing_regulations.sizeLimit.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {displayData.fishing_regulations.sizeLimit.source}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bag Limit */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Bag Limit
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {displayData.fishing_regulations.bagLimit.value}
                        </span>
                        {displayData.fishing_regulations.bagLimit.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {displayData.fishing_regulations.bagLimit.source}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Penalties */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Penalties
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {displayData.fishing_regulations.penalties.value ===
                          "Yes"
                            ? "Yes"
                            : displayData.fishing_regulations.penalties
                                  .value === "No"
                              ? "No"
                              : displayData.fishing_regulations.penalties.value}
                        </span>
                        {displayData.fishing_regulations.penalties.value !==
                          "Check with local authorities" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Source:{" "}
                            {displayData.fishing_regulations.penalties.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Disclaimer */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      These regulations are AI-generated and may be outdated or
                      inaccurate. Never rely solely on this information for
                      legal compliance. Always check with official local
                      authorities before fishing to avoid fines.
                    </p>
                  </div>
                </Card>
              ) : regulationsAccumulator ? (
                <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Fishing Regulations
                    </h2>
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                      Fetching regulations...
                    </div>
                  </div>
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
                      ></div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {/* Footer Disclaimers */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                  These fishing methods and gear specifications are AI-generated
                  based on established practices. Always verify technical
                  details with local guides or experienced anglers.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Found inaccurate information? Help us improve by reporting it
                  on our Instagram{" "}
                  <button
                    onClick={() =>
                      window.open(
                        "https://www.instagram.com/lishka.app/",
                        "_blank",
                      )
                    }
                    className="underline hover:no-underline font-medium text-gray-500 dark:text-gray-500"
                  >
                    @lishka.app
                  </button>
                </p>
              </div>
            </div>

            <div className="h-[80px] lg:hidden"></div>
          </div>

          {/* Weather Widget - Desktop only */}
          <div className="hidden lg:block lg:w-[380px] lg:flex-none bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto">
            <div className="h-full overflow-y-auto">
              <WeatherWidgetPro />
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Navigation - Mobile only */}
      <BottomNav />

      {/* Flag Fish Dialog */}
      {displayData?.id && (
        <FlagFishDialog
          open={flagDialogOpen}
          onOpenChange={setFlagDialogOpen}
          fishId={displayData.id}
          fishName={displayData.name || "Unknown Fish"}
          currentlyFlagged={displayData.flagged_for_review || false}
        />
      )}
    </div>
  );
};

export default FishDetailPage;
