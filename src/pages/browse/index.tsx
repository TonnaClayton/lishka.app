import {
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useState,
  useLayoutEffect,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useScrollRestoration } from "use-scroll-restoration";
import { ArrowLeft, Flag } from "lucide-react";
import FishCard from "@/components/fish-card";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  useBrowseFish,
  type BrowseFilters,
  type BrowseFishItem,
} from "@/hooks/queries/fish/use-browse-fish";
import {
  getCategoryDisplayTitle,
  getCategoryDisplayInfo,
} from "@/lib/fish-categories";
import { useUserLocation } from "@/hooks/queries";
import { useReviewAccess } from "@/hooks/queries/fish/use-review-access";
import { FlagFishDialog } from "@/components/flag-fish-dialog";

/**
 * Browse Results Page
 *
 * Displays a paginated grid of fish filtered by a single category
 * (passed via query parameters, e.g. ?habitats=pelagic).
 */
const BrowsePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Curator review access
  const { data: reviewAccess } = useReviewAccess();
  const canReview = reviewAccess?.canReview ?? false;

  // Flag dialog state
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedFish, setSelectedFish] = useState<BrowseFishItem | null>(null);

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

  // Derive the category info (title + subtitle) for the content area
  const categoryInfo = useMemo(() => {
    const geoKeys = new Set(["latitude", "longitude"]);
    const entries = Object.entries(filters).filter(
      ([k, v]) => !geoKeys.has(k) && v !== undefined && v !== "",
    );
    if (entries.length === 0) {
      return { title: "Browse Fish", subtitle: "" };
    }
    const [key, value] = entries[0];
    return getCategoryDisplayInfo(key, value as string);
  }, [filters]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useBrowseFish(filters);

  const fishList = data?.pages.flat() ?? [];

  // Scroll restoration
  const scrollKey = `browse-scroll-${searchParams.toString()}`;
  const { ref: scrollRef, setScroll } = useScrollRestoration(scrollKey, {
    debounceTime: 100,
    persist: "sessionStorage",
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const restoredRef = useRef(false);

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerRef.current = node;
      scrollRef(node);
    },
    [scrollRef],
  );

  const ready = !isLoading && fishList.length > 0;

  useLayoutEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;

    const saved = sessionStorage.getItem(scrollKey);
    if (!saved) return;

    const y = parseInt(saved, 10);
    if (y > 0) {
      requestAnimationFrame(() => {
        setScroll({ y });
      });
    }
  }, [ready, scrollKey, setScroll]);

  const saveScrollAndNavigate = useCallback(
    (path: string, state?: Record<string, unknown>) => {
      const el = scrollContainerRef.current;
      if (el) {
        sessionStorage.setItem(scrollKey, String(el.scrollTop));
      }
      navigate(path, { state });
    },
    [scrollKey, navigate],
  );

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
      </header>

      {/* Content */}
      <div
        ref={mergedRef}
        className="flex-1 w-full py-4 lg:py-6 pb-20 overflow-y-auto"
      >
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
            {/* Category Title and Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {categoryInfo.title}
              </h2>
              {categoryInfo.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {categoryInfo.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {fishList.map((fish, index) => (
                <div
                  key={`${fish.scientificName}-${index}`}
                  className="relative"
                >
                  <FishCard
                    name={fish.name}
                    scientificName={fish.scientificName}
                    habitat={fish.habitat}
                    difficulty={fish.difficulty}
                    isToxic={fish.isToxic}
                    image={fish.image}
                    onClick={() =>
                      saveScrollAndNavigate(`/fish/${fish.slug}`, { fish })
                    }
                  />
                  {canReview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFish(fish);
                        setFlagDialogOpen(true);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label={
                        fish.flaggedForReview
                          ? "Remove investigation flag"
                          : "Flag for investigation"
                      }
                    >
                      <Flag
                        className={`h-4 w-4 ${
                          fish.flaggedForReview
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  )}
                </div>
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

      {/* Flag Fish Dialog */}
      {selectedFish && (
        <FlagFishDialog
          open={flagDialogOpen}
          onOpenChange={(open) => {
            setFlagDialogOpen(open);
            if (!open) setSelectedFish(null);
          }}
          fishId={selectedFish.id}
          fishName={selectedFish.name}
          currentlyFlagged={selectedFish.flaggedForReview}
        />
      )}
    </div>
  );
};

export default BrowsePage;
