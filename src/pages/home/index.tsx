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
import { useFishStream, useToxicFishStream } from "@/hooks/queries";
import { useUserLocation } from "@/hooks/queries/location/use-location";
import { DEFAULT_LOCATION } from "@/lib/const";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingDialog } from "./onboarding-dialog";
import LocationBtn from "@/components/location-btn";

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

  // React Query hooks - Replaced with streaming
  const fishStream = useFishStream({
    userLocation,
    autoStart: true,
  });

  const toxicStream = useToxicFishStream({
    userLocation,
    autoStart: true,
  });

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

        {/* Toxic Fish Stream Section -  */}
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
          {toxicStream.allFish.length > 0 &&
            localStorage.getItem("showToxicFishDebug") === "true" && (
              <div className="mb-2 p-2 bg-blue-50 px-4 lg:px-6 /20 border border-blue-200 dark:border-blue-800 rounded text-xs space-y-1">
                <div className="font-mono text-lishka-blue">
                  DEBUG: Streaming - {toxicStream.allFish.length} total (
                  {toxicStream.cachedFish.length} cached,{" "}
                  {toxicStream.newFish.length} new)
                </div>
                <div className="font-mono text-lishka-blue">
                  Progress: {toxicStream.progress}% | Status:{" "}
                  {toxicStream.statusMessage}
                </div>
              </div>
            )}

          {toxicStream.error ? (
            <div className="bg-yellow-50 px-4 lg:px-6 mx-4 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Unable to load toxic fish data: {toxicStream.error}
              </p>
            </div>
          ) : toxicStream.isStreaming && toxicStream.allFish.length === 0 ? (
            <div className="mb-8">
              <div className="mb-4 px-4 lg:px-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <ToxicFishSkeleton />
            </div>
          ) : toxicStream.allFish.length === 0 && !toxicStream.isStreaming ? (
            <div className="bg-yellow-50 px-4 lg:px-6 mx-4 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Unable to load toxic fish data at the moment. Please check your
                connection and try refreshing the page.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 px-4 lg:px-6 scrollbar-hide">
              {toxicStream.allFish.map((fish, index) => (
                <div
                  key={`stream-toxic-${fish.scientificName}-${index}`}
                  className="flex-shrink-0 w-40 animate-fadeIn"
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
              {toxicStream.isStreaming && (
                <div className="flex-shrink-0 w-40">
                  <ToxicFishSkeleton />
                </div>
              )}
            </div>
          )}
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

        {/* Active Fish Section - Streaming */}
        <div className="mb-8">
          <div className="mb-6 px-4 lg:px-6">
            <h2 className="text-xl font-bold mb-1 text-black dark:text-white">
              Active fish in {getCurrentMonth()}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Discover fish species available in your area this month
            </p>
          </div>

          {fishStream.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mx-4 rounded-lg p-4 mb-6 flex flex-col">
              <p className="text-red-700 dark:text-red-400 break-words whitespace-normal">
                {fishStream.error}
              </p>
              <Button
                variant="outline"
                className="mt-2 w-fit"
                onClick={() => fishStream.reset()}
              >
                Try Again
              </Button>
            </div>
          ) : fishStream.isStreaming && fishStream.allFish.length === 0 ? (
            <div className="px-4 lg:px-6">
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
            </div>
          ) : fishStream.allFish.length === 0 && !fishStream.isStreaming ? (
            <div className="bg-yellow-50 px-4 lg:px-6 mx-4 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Unable to load fish data. Please check your connection and try
                refreshing.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 px-4 lg:px-6">
                {fishStream.allFish.map((fish, index) => (
                  <div
                    key={`stream-fish-${fish.scientificName}-${index}`}
                    className="animate-fadeIn"
                  >
                    <FishCard
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
                  </div>
                ))}
                {fishStream.isStreaming && (
                  <>
                    {[...Array(4)].map((_, index) => (
                      <Card
                        key={`skeleton-${index}`}
                        className="overflow-hidden h-full"
                      >
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
                  </>
                )}
              </div>
            </>
          )}
        </div>
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
