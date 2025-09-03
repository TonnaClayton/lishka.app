import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FishDetailSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Fish Image Card Skeleton */}
      <Card className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
          <Skeleton className="w-full h-full" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <Skeleton className="h-6 w-32 mb-2 bg-white/20" />
            <Skeleton className="h-4 w-24 bg-white/20" />
          </div>
        </div>
      </Card>

      {/* Description Card Skeleton */}
      <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>

      {/* Conservation Banner Skeleton */}
      <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="flex justify-between items-end">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </Card>

      {/* Fishing Season Calendar Skeleton */}
      <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-12 gap-0.5 sm:gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </Card>

      {/* All Round Gear Skeleton */}
      <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
            >
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </Card>

      {/* Fishing Methods Skeleton */}
      {Array.from({ length: 3 }).map((_, methodIndex) => (
        <Card
          key={methodIndex}
          className="p-6 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="space-y-4">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Gear Information Grid Skeleton */}
            <div>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, gearIndex) => (
                  <div
                    key={gearIndex}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                  >
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tip Skeleton */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </Card>
      ))}

      {/* Fishing Regulations Skeleton */}
      <Card className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg"
            >
              <div className="flex flex-col">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer Disclaimers Skeleton */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
};

export default FishDetailSkeleton;
