import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="flex-1 w-full p-4 lg:p-6 pb-20 overflow-y-auto">
        {/* Fishing Tips Carousel Section Skeleton */}

        {/* Gear Recommendation Widget Skeleton */}

        {/* Toxic Fish Section Skeleton */}

        {/* Active Fish Section Skeleton */}
      </div>
    </div>
  );
};

export default HomePageSkeleton;
