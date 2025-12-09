import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import FishCard from "@/components/fish-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

import LocationModal from "@/components/location-modal";
import EmailVerificationBanner from "@/components/email-verification-banner";
import GearRecommendationWidget from "./gear-recommendation-widget";
import ToxicFishSkeleton from "./toxic-fish-skeleton";
import FishingTipsCarousel from "./fishing-tips-carousel";

// Import Dialog components from ui folder
import {
  useFishDataInfinite,
  useToxicFishData,
  useToxicFishStream,
} from "@/hooks/queries";
import { useUserLocation } from "@/hooks/queries/location/use-location";
import { DEFAULT_LOCATION } from "@/lib/const";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingDialog } from "./onboarding-dialog";
import LocationBtn from "@/components/location-btn";
import { Loader2, Sparkles, Zap } from "lucide-react";

interface HomePageProps {
  location?: string;
  onLocationChange?: (location: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLocationChange = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { location: currentLocation } = useUserLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const userLocation = currentLocation?.name ?? DEFAULT_LOCATION.name;
  const userLatitude = currentLocation?.latitude;
  const userLongitude = currentLocation?.longitude;

  const openLocationModal = useMemo(() => {
    if (profile === undefined) {
      return false;
    }

    const needsLocationAfterOnboarding =
      (profile?.location === "" || profile?.location === null) &&
      profile?.has_seen_onboarding_flow === true;

    if (isLocationModalOpen || needsLocationAfterOnboarding) {
      return true;
    }

    return false;
  }, [profile, isLocationModalOpen]);

  const hasSeenOnboardingFlow = useMemo(() => {
    const hasSeenOnboardingFlowFromLocationState =
      location.state?.hasSeenOnboardingFlow;

    // If location state says user just completed onboarding, they have seen it
    if (hasSeenOnboardingFlowFromLocationState === true) {
      return true;
    }

    // If profile is still loading, assume they haven't seen it yet
    if (profile === undefined) {
      return false;
    }

    return profile?.has_seen_onboarding_flow === true;
  }, [profile, location.state]);

  // React Query hooks
  const {
    data: fishData,
    isLoading: loadingFish,
    error: fishError,
    // fetchNextPage,
    // hasNextPage,
    // isFetchingNextPage,
  } = useFishDataInfinite(userLocation, userLatitude, userLongitude);

  const { data: toxicFishData, isLoading: loadingToxicFish } = useToxicFishData(
    userLocation,
    userLatitude,
    userLongitude,
  );

  // Streaming toxic fish hook
  const toxicStream = useToxicFishStream(
    `${import.meta.env.VITE_API_URL || ""}/fish/toxic/stream`,
  );

  // Extract fish list from infinite query data
  const fishList = fishData?.pages.flatMap((page) => page) || [];
  const toxicFishList = toxicFishData || [];
  const debugInfo = null;

  // Get current month
  const getCurrentMonth = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[new Date().getMonth()];
  };

  // Helper function to format the subtitle
  const getSeaName = (location: string) => {
    const cleanLocation = location.split(/[,\s]+/).pop() || location;
    const seaOcean = "Regional Waters"; // Simplified for now
    return `${cleanLocation} & ${seaOcean} waters`;
  };

  // const handleLoadMore = () => {
  //   fetchNextPage();
  // };

  return (
    <div className="flex flex-col dark:bg-background h-full relative border-l-0 border-y-0 border-r-0 rounded-xl">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full lg:hidden dark:bg-gray-800 border-t-0 border-x-0 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-night.svg"
              alt="Fishing AI Logo"
              className="h-8 w-auto hidden dark:block"
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold dark:text-white">Home</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Location Information */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-lishka-blue dark:text-lishka-blue hover:text-lishka-blue dark:hover:text-lishka-blue p-1 h-auto"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <LocationBtn
                useLocationContext={true}
                location={{
                  name: userLocation,
                  latitude: userLatitude ?? 0,
                  longitude: userLongitude ?? 0,
                }}
              />
            </Button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 w-full py-4 lg:py-6 pb-20 overflow-y-auto">
        {/* Fishing Tips Carousel Section */}
        <div className="px-4 lg:px-6 mb-9">
          <FishingTipsCarousel location={userLocation} />
        </div>

        {/* Gear Recommendation Widget */}
        <div className="mb-8">
          <GearRecommendationWidget />
        </div>

        {/* Toxic Fish Section */}
        <div className="mb-8">
          <div className="px-4 lg:px-6">
            <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
              Toxic & Risky Catches
            </h2>
            <p className="text-sm mb-4 text-gray-600">
              Venomous and toxic fish found in {getSeaName(userLocation)}.
            </p>
          </div>

          {/* Debug Info */}
          {toxicFishList.length > 0 &&
            localStorage.getItem("showToxicFishDebug") === "true" && (
              <div className="mb-2 p-2 bg-blue-50 px-4 lg:px-6 /20 border border-blue-200 dark:border-blue-800 rounded text-xs space-y-1">
                <div className="font-mono text-lishka-blue ">
                  DEBUG: Final toxic fish count: {toxicFishList.length}
                </div>
                {/* Show debug info from state if available */}
                {debugInfo && (
                  <>
                    <div className="font-mono text-lishka-blue ">
                      Location: {getSeaName(userLocation)}
                    </div>
                    <div className="font-mono text-lishka-blue ">
                      Original count from OpenAI: {debugInfo.originalCount}
                    </div>
                    {debugInfo.filteredOut.length > 0 && (
                      <div className="font-mono text-orange-700 dark:text-orange-400">
                        Filtered out {debugInfo.filteredOut.length} fish:{" "}
                        {debugInfo.filteredOut.map((f) => f.name).join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          {loadingToxicFish ? (
            <div className="mb-8">
              <div className="mb-4 px-4 lg:px-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <ToxicFishSkeleton />
            </div>
          ) : toxicFishList.length === 0 ? (
            <div className="bg-yellow-50 px-4 lg:px-6 mx-4 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Unable to load toxic fish data at the moment. Please check your
                connection and try refreshing the page.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 px-4 lg:px-6 scrollbar-hide">
              {toxicFishList.map((fish, index) => (
                <div
                  key={`toxic-${fish.scientific_name}-${index}`}
                  className="flex-shrink-0 w-40"
                >
                  <FishCard
                    name={fish.name}
                    scientificName={fish.scientific_name}
                    habitat={fish.habitat}
                    difficulty={fish.difficulty}
                    isToxic={fish.is_toxic}
                    dangerType={fish.danger_type}
                    image={fish.image}
                    onClick={() =>
                      navigate(`/fish/${fish.slug}`, {
                        state: { fish },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toxic Fish Stream Section - NEW STREAMING VERSION! */}
        <div className="mb-8">
          <div className="px-4 lg:px-6 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Toxic Fish (Live Stream)
                </h2>
                <Sparkles className="w-5 h-5 text-lishka-blue animate-pulse" />
              </div>
              {!toxicStream.isStreaming && !toxicStream.isComplete && (
                <Button
                  onClick={toxicStream.startStream}
                  size="sm"
                  className="bg-lishka-blue hover:bg-lishka-blue/90 text-white"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Start Discovery
                </Button>
              )}
              {toxicStream.isStreaming && (
                <Button
                  onClick={toxicStream.stopStream}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Stop
                </Button>
              )}
              {toxicStream.isComplete && (
                <Button onClick={toxicStream.reset} size="sm" variant="outline">
                  Reset
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Real-time discovery of venomous and toxic fish
            </p>
          </div>

          {/* Progress Bar */}
          {toxicStream.isStreaming && (
            <div className="px-4 lg:px-6 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-lishka-blue" />
                    {toxicStream.statusMessage}
                  </span>
                  <span className="font-semibold text-lishka-blue">
                    {toxicStream.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-lishka-blue h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${toxicStream.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Checked: {toxicStream.stats.checked}/
                    {toxicStream.stats.total}
                  </span>
                  <span>
                    Found: {toxicStream.stats.found} (
                    {toxicStream.stats.newFound} new)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {toxicStream.error && (
            <div className="px-4 lg:px-6 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  Error: {toxicStream.error}
                </p>
              </div>
            </div>
          )}

          {/* Comparison Stats */}
          {toxicStream.isComplete && (
            <div className="px-4 lg:px-6 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      ✅ Discovery Complete!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Found {toxicStream.stats.found} toxic species (
                      {toxicStream.stats.cachedCount} cached,{" "}
                      {toxicStream.stats.newFound} newly discovered)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">vs Non-Streaming</p>
                    <p className="text-lg font-bold text-lishka-blue">
                      {toxicStream.allFish.length} vs {toxicFishList.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fish Cards - Show as they stream in! */}
          {toxicStream.allFish.length > 0 ? (
            <div className="space-y-4">
              {/* Cached Fish */}
              {toxicStream.cachedFish.length > 0 && (
                <div>
                  <div className="px-4 lg:px-6 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      💾 From Cache ({toxicStream.cachedFish.length})
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 px-4 lg:px-6 scrollbar-hide">
                    {toxicStream.cachedFish.map((fish, index) => (
                      <div
                        key={`cached-${fish.scientificName}-${index}`}
                        className="flex-shrink-0 w-40 animate-fade-in"
                      >
                        <FishCard
                          name={fish.name}
                          scientificName={fish.scientificName}
                          habitat={fish.habitat}
                          difficulty={fish.difficulty}
                          isToxic={fish.isToxic}
                          dangerType={fish.dangerType}
                          image={fish.image}
                          onClick={() =>
                            navigate(`/fish/${fish.slug}`, {
                              state: { fish },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly Discovered Fish */}
              {toxicStream.newFish.length > 0 && (
                <div>
                  <div className="px-4 lg:px-6 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-lishka-blue" />
                      Newly Discovered ({toxicStream.newFish.length})
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 px-4 lg:px-6 scrollbar-hide">
                    {toxicStream.newFish.map((fish, index) => (
                      <div
                        key={`new-${fish.scientificName}-${index}`}
                        className="flex-shrink-0 w-40 animate-slide-up"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                        }}
                      >
                        <div className="relative">
                          <div className="absolute -top-2 -right-2 z-10 bg-lishka-blue text-white text-xs px-2 py-0.5 rounded-full font-bold animate-bounce">
                            NEW
                          </div>
                          <FishCard
                            name={fish.name}
                            scientificName={fish.scientificName}
                            habitat={fish.habitat}
                            difficulty={fish.difficulty}
                            isToxic={fish.isToxic}
                            dangerType={fish.dangerType}
                            image={fish.image}
                            onClick={() =>
                              navigate(`/fish/${fish.slug}`, {
                                state: { fish },
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !toxicStream.isStreaming && !toxicStream.error ? (
            <div className="px-4 lg:px-6">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Click "Start Discovery" to see real-time toxic fish streaming!
                </p>
                <p className="text-xs text-gray-500">
                  Watch as fish are discovered one by one, just like ChatGPT
                  streaming ⚡
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Offshore Fishing Locations Section - TEMPORARILY HIDDEN */}
        {/* TODO: This section requires refinement for accurate location suggestions */}
        {/* The OffshoreFishingLocations component needs improvement before re-enabling */}
        {/*
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
            Offshore Fishing Hotspots
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered analysis of underwater structures, wrecks, and drop-offs
            within 10NM of your location. Each spot is ranked by fish activity
            probability.
          </p>
          {localStorage.getItem("showLocationDebug") === "true" && (
            <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
              <div className="font-mono text-green-700 dark:text-green-400">
                DEBUG: Passing userLocation to OffshoreFishingLocations: "
                {userLocation}"
              </div>
            </div>
          )}
          <OffshoreFishingLocations userLocation={userLocation} />
        </div>
        */}

        {/* Active Fish Section */}
        {loadingFish ? (
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-4" />
            </div>

            {/* Fish Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="overflow-hidden h-full">
                  <div className="relative w-full aspect-[3/2] overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardContent className="p-2 sm:p-3 flex flex-col flex-1">
                    <div className="mb-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Skeleton className="h-3 w-3 mr-1" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-3 w-3 mr-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button Skeleton */}
            <div className="flex justify-center mb-20 lg:mb-6">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 px-4 lg:px-6">
              <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
                Active fish in {getCurrentMonth()}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Discover fish species available in your area this month
              </p>
            </div>

            {fishError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mx-4 rounded-lg p-4 mb-6 flex flex-col">
                <p className="text-red-700 dark:text-red-400 break-words whitespace-normal">
                  {fishError.message}
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-fit"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 px-4 lg:px-6">
                  {fishList.map((fish, index) => (
                    <FishCard
                      key={`${fish.scientific_name}-${index}`}
                      name={fish.name}
                      scientificName={fish.scientific_name}
                      habitat={fish.habitat}
                      difficulty={fish.difficulty}
                      isToxic={fish.is_toxic}
                      image={fish.image}
                      onClick={() =>
                        navigate(`/fish/${fish.slug}`, {
                          state: { fish },
                        })
                      }
                    />
                  ))}
                </div>

                {/* {fishList.length > 0 && hasNextPage && (
                  <div className="flex justify-center mb-20 lg:mb-6">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      className="w-fit bg-[#025DFB1A] text-lishka-blue hover:bg-[#025DFB33] hover:text-lishka-blue rounded-[24px] h-[39px] py-3 px-4 font-semibold text-xs shadow-none"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                          <LoadingDots />
                          <p className="">Loading...</p>
                        </div>
                      ) : (
                        "Load more fish"
                      )}
                    </Button>
                  </div>
                )} */}
              </>
            )}
          </>
        )}
      </div>
      {/* Bottom Navigation */}
      <BottomNav />
      {/* Location Modal */}
      <LocationModal
        isOpen={openLocationModal}
        onClose={() => {
          if (profile?.location != "" && profile?.location != null) {
            setIsLocationModalOpen(false);
          }
        }}
        onLocationSelect={(newLocation) => {
          onLocationChange(newLocation.name);
        }}
        currentLocation={currentLocation ?? null}
        title="Set Your Location"
      />
      <OnboardingDialog hasSeenOnboardingFlow={hasSeenOnboardingFlow} />
    </div>
  );
};

export default HomePage;
