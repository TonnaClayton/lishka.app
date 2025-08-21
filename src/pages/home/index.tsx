import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import FishCard from "@/components/fish-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

import LoadingDots from "@/components/loading-dots";
import LocationModal from "@/components/location-modal";
import EmailVerificationBanner from "@/components/email-verification-banner";
import GearRecommendationWidget from "./gear-recommendation-widget";
import ToxicFishSkeleton from "./toxic-fish-skeleton";
import FishingTipsCarousel from "./fishing-tips-carousel";

// Import Dialog components from ui folder
import {
  useFishDataInfinite,
  useProfile,
  useToxicFishData,
} from "@/hooks/queries";
import { DEFAULT_LOCATION } from "@/lib/const";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingDialog } from "./onboarding-dialog";

interface HomePageProps {
  location?: string;
  onLocationChange?: (location: string) => void;
}

interface FishData {
  slug: string;
  name: string;
  scientificName: string;
  localName?: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  isToxic: boolean;
  dangerType?: string;
  image?: string;
  probabilityScore?: number;
}

const HomePage: React.FC<HomePageProps> = ({ onLocationChange = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const userLocation = useMemo(() => {
    return profile?.location || DEFAULT_LOCATION.name;
  }, [profile]);

  const openLocationModal = useMemo(() => {
    if (profile == undefined) {
      return false;
    }

    if (
      (profile?.location == "" || profile?.location == null) &&
      profile?.has_seen_onboarding_flow !== true &&
      isLocationModalOpen
    ) {
      return true;
    }
    return false;
  }, [profile]);

  const hasSeenOnboardingFlow = useMemo(() => {
    const hasSeenOnboardingFlow = location.state?.hasSeenOnboardingFlow;

    if (hasSeenOnboardingFlow === true) {
      return false;
    }

    if (profile == undefined) {
      return true;
    }

    return profile.has_seen_onboarding_flow == true;
  }, [profile]);

  // React Query hooks
  const {
    data: fishData,
    isLoading: loadingFish,
    error: fishError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFishDataInfinite(userLocation);

  const { data: toxicFishData, isLoading: loadingToxicFish } = useToxicFishData(
    userLocation,
    (profile?.location_coordinates as any)?.latitude,
    (profile?.location_coordinates as any)?.longitude
  );

  // Extract fish list from infinite query data
  const fishList = fishData?.pages.flatMap((page) => page) || [];
  const toxicFishList = toxicFishData || [];
  //const debugInfo = toxicFishData?.debugInfo || null;
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

  // Location validation and standardization
  // const validateLocation = (location: string) => {
  //   if (!location) return "Unknown Location";
  //   try {
  //     // Handle JSON string locations
  //     const parsed = JSON.parse(location);
  //     return parsed.name || location;
  //   } catch {
  //     // Not JSON, use as is
  //     return location;
  //   }
  // };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  // Helper function to get user initials
  // const getInitials = (name: string) => {
  //   return name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  //     .slice(0, 2);
  // };

  // Handle avatar click to navigate to profile
  // const handleAvatarClick = () => {
  //   navigate("/profile");
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
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 h-auto"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <span className="text-sm truncate">{userLocation}</span>
              <MapPin className="h-4 w-4" />
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
        <div className="mb-8 px-4 lg:px-6">
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
              <div className="mb-2 p-2 bg-blue-50 px-4 lg:px-6 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs space-y-1">
                <div className="font-mono text-blue-700 dark:text-blue-400">
                  DEBUG: Final toxic fish count: {toxicFishList.length}
                </div>
                {/* Show debug info from state if available */}
                {debugInfo && (
                  <>
                    <div className="font-mono text-blue-700 dark:text-blue-400">
                      Location: {getSeaName(userLocation)}
                    </div>
                    <div className="font-mono text-blue-700 dark:text-blue-400">
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
            <div className="mb-8 px-4 lg:px-6">
              <div className="mb-4">
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

                {fishList.length > 0 && hasNextPage && (
                  <div className="flex justify-center mb-20 lg:mb-6">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      className="w-full max-w-xs"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex flex-col items-center">
                          <LoadingDots />
                          <p className="text-sm text-muted-foreground mt-2">
                            Loading...
                          </p>
                        </div>
                      ) : (
                        "Load More Fish"
                      )}
                    </Button>
                  </div>
                )}
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
        currentLocation={(() => {
          const locationCoordinates = profile?.location_coordinates as any;

          return locationCoordinates
            ? {
                latitude: locationCoordinates.latitude as number | undefined,
                longitude: locationCoordinates.longitude as number | undefined,
                name: profile.location,
              }
            : null;
        })()}
        title="Set Your Location"
      />
      <OnboardingDialog hasSeenOnboardingFlow={hasSeenOnboardingFlow} />
    </div>
  );
};

export default HomePage;
