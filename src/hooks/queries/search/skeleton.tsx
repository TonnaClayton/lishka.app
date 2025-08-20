import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SearchPageSkeletonProps {
  className?: string;
}

const SearchPageSkeleton: React.FC<SearchPageSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col bg-white h-full relative dark:bg-black w-full",
        className
      )}
    >
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-4 py-3 lg:static">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-10" />
        </div>
      </header>

      {/* Content Area Skeleton */}
      <div className="flex-1 h-full pt-16">
        <div className="flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center space-y-6 h-full">
          {/* Icon placeholder */}
          <Skeleton className="h-14 w-14 rounded-full" />

          {/* Title placeholder */}
          <Skeleton className="h-8 w-64" />

          {/* Description placeholder */}
          <Skeleton className="h-5 w-80" />

          {/* Suggestions placeholders */}
          <div className="flex flex-wrap justify-center gap-2 w-full max-w-md">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-32 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      {/* Input Form Skeleton */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 md:static md:bottom-auto md:border-t md:w-full md:mx-auto md:mb-4">
        <div className="w-full max-w-2xl mx-auto relative">
          <div className="relative flex items-center overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-col pr-2 pl-0 rounded-2xl">
            <Skeleton className="h-12 w-full" />
            <div className="gap-auto justify-between w-full flex items-baseline px-2 py-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 md:hidden">
        <div className="flex justify-around items-center py-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPageSkeleton;
