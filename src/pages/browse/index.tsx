import { useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Cloud, Sun, CloudRain, CloudSnow } from "lucide-react";
import FishCard from "@/components/fish-card";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  useBrowseFish,
  type BrowseFilters,
} from "@/hooks/queries/fish/use-browse-fish";
import { getCategoryDisplayTitle } from "@/lib/fish-categories";
import { useUserLocation, useGetWeatherSummary } from "@/hooks/queries";

/**
 * Browse Results Page
 *
 * Displays a paginated grid of fish filtered by a single category
 * (passed via query parameters, e.g. ?habitats=pelagic).
 */
const BrowsePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Location & weather
  const { location: currentLocation } = useUserLocation();

  // Extract filter from query string + user's coordinates for geographic scoping
  const filters: BrowseFilters = useMemo(() => {
    const f: BrowseFilters = {};
    const keys = [
      "habitats",
      "depthBands",
      "techniques",
      "catchProfile",
      "catchRarity",
      "feedingStyles",
      "freshwaterHabitats",
    ] as const;
    for (const key of keys) {
      const val = searchParams.get(key);
      if (val) {
        f[key] = val;
      }
    }

    // Send coordinates so the backend can resolve the country and scope results
    if (currentLocation?.latitude && currentLocation?.longitude) {
      f.latitude = currentLocation.latitude;
      f.longitude = currentLocation.longitude;
    }

    return f;
  }, [searchParams, currentLocation?.latitude, currentLocation?.longitude]);

  // Derive the page title from the category filter (ignoring geo fields)
  const pageTitle = useMemo(() => {
    const geoKeys = new Set(["latitude", "longitude"]);
    const entries = Object.entries(filters).filter(
      ([k, v]) => !geoKeys.has(k) && v !== undefined && v !== "",
    );
    if (entries.length === 0) return "Browse Fish";
    const [key, value] = entries[0];
    return getCategoryDisplayTitle(key, value as string);
  }, [filters]);

  const {
    data: weatherSummary,
    isLoading: loadingWeather,
    isError: errorWeather,
  } = useGetWeatherSummary({
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
    name: currentLocation?.name,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useBrowseFish(filters);

  const fishList = data?.pages.flat() ?? [];

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="flex flex-col dark:bg-background h-full relative rounded-xl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground truncate">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Weather strip */}
        <div className="mt-2 lg:hidden">
          {loadingWeather ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
              <p className="text-xs text-muted-foreground">
                Loading weather...
              </p>
            </div>
          ) : weatherSummary && typeof weatherSummary === "object" ? (
            <div className="flex items-center gap-3 px-1 gap-x-[16px]">
              {/* Weather icon + temperature */}
              <div className="flex items-center gap-x-[4px]">
                {weatherSummary.condition === "Clear" && (
                  <Sun className="w-6 h-6 text-[#FFBF00]" />
                )}
                {weatherSummary.condition === "Partly cloudy" && (
                  <Cloud className="w-6 h-6 text-lishka-blue" />
                )}
                {weatherSummary.condition === "Rainy" && (
                  <CloudRain className="w-6 h-6 text-lishka-blue" />
                )}
                {weatherSummary.condition === "Snowy" && (
                  <CloudSnow className="w-6 h-6 text-lishka-blue" />
                )}
                {!["Clear", "Partly cloudy", "Rainy", "Snowy"].includes(
                  weatherSummary.condition,
                ) && <Cloud className="w-6 h-6 text-lishka-blue" />}
                <span className="text-foreground text-lg font-normal">
                  {weatherSummary.temperature !== null
                    ? `${weatherSummary.temperature}°`
                    : "--°"}
                </span>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#A855F7] rotate-45"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <span className="text-foreground text-lg">
                  {weatherSummary.wind_speed !== null
                    ? `${weatherSummary.wind_speed} km/h`
                    : "--"}
                </span>
              </div>

              {/* Wave height */}
              {weatherSummary.wave_height !== null && (
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-lishka-blue"
                  >
                    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                  </svg>
                  <span className="text-foreground text-lg">
                    {weatherSummary.wave_height}m
                  </span>
                </div>
              )}
            </div>
          ) : errorWeather ? (
            <p className="text-xs text-muted-foreground italic">
              Weather unavailable
            </p>
          ) : null}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full py-4 lg:py-6 pb-20 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden h-full rounded-xl">
                  <div className="relative w-full aspect-[3/2] overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardContent className="p-2 sm:p-3 lg:p-4 flex flex-col flex-1">
                    <div className="mb-1 lg:mb-2">
                      <Skeleton className="h-4 lg:h-5 w-3/4 mb-1" />
                      <Skeleton className="h-3 lg:h-4 w-full" />
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                      <div className="flex items-center">
                        <Skeleton className="h-3 lg:h-4 w-3 lg:w-4 mr-1" />
                        <Skeleton className="h-3 lg:h-4 w-2/3" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-3 lg:h-4 w-3 lg:w-4 mr-1" />
                        <Skeleton className="h-3 lg:h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="px-4 lg:px-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to load fish. Please try again."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : fishList.length === 0 ? (
          <div className="px-4 lg:px-6 text-center py-12">
            <p className="text-muted-foreground text-sm">
              No fish found for this category yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <p className="text-sm text-muted-foreground mb-4">
              {fishList.length} species found
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {fishList.map((fish, index) => (
                <FishCard
                  key={`${fish.scientificName}-${index}`}
                  name={fish.name}
                  scientificName={fish.scientificName}
                  habitat={fish.habitat}
                  difficulty={fish.difficulty}
                  isToxic={fish.isToxic}
                  image={fish.image}
                  onClick={() =>
                    navigate(`/fish/${fish.slug}`, {
                      state: { fish },
                    })
                  }
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div
              ref={sentinelRef}
              className="h-10 flex items-center justify-center"
            >
              {isFetchingNextPage && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-lishka-blue" />
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BrowsePage;
