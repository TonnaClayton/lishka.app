import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import FishingTipsSkeleton from "./fishing-tips-skeleton";
import GearRecommendationSkeleton from "./gear-recommendation-skeleton";
import ToxicFishSkeleton from "./toxic-fish-skeleton";

const HomePageSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col dark:bg-background h-full relative border-l-0 border-y-0 border-r-0 rounded-xl">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full lg:hidden dark:bg-gray-800 border-t-0 border-x-0 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full pb-20 overflow-y-auto">
        {/* Fishing Tips Carousel Section Skeleton */}
        <div className="px-4 lg:px-6">
          <FishingTipsSkeleton />
        </div>

        {/* Gear Recommendation Widget Skeleton */}
        <div className="px-4 lg:px-6">
          <GearRecommendationSkeleton />
        </div>

        {/* Toxic Fish Section Skeleton */}
        <div className="mb-8">
          <div className="mb-4 px-4 lg:px-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <ToxicFishSkeleton />
        </div>

        {/* Active Fish Section Skeleton */}
        <div className="mb-6 px-4 lg:px-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
        </div>

        {/* Fish Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 px-4 lg:px-6 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
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
    </div>
  );
};

export default HomePageSkeleton;
