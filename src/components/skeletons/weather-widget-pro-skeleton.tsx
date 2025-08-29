import React from "react";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const WeatherWidgetProSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 max-w-full overflow-x-hidden w-full py-4 lg:px-4">
      {/* Location Button Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Weather Card Skeleton */}
      <Card className="p-6 bg-gradient-to-br from-lishka-blue to-[#1E40AF] text-white overflow-hidden relative shadow-md rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20 mt-2" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
        </div>

        <div className="mt-6 mb-6">
          <Skeleton className="h-16 w-24 bg-white/20" />
          <Skeleton className="h-4 w-40 bg-white/20 mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-4 w-4 bg-blue-200 mb-1" />
              <Skeleton className="h-6 w-8 bg-white/20" />
              <Skeleton className="h-3 w-12 bg-white/20 mt-1" />
            </div>
          ))}
        </div>

        {/* Sunrise/Sunset Skeleton */}
        <div className="mt-4 flex justify-between items-center bg-black/10 p-3 rounded-xl">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 bg-yellow-300 mr-2" />
            <div>
              <Skeleton className="h-3 w-16 bg-white/20" />
              <Skeleton className="h-4 w-12 bg-white/20 mt-1" />
            </div>
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 bg-blue-200 mr-2" />
            <div>
              <Skeleton className="h-3 w-16 bg-white/20" />
              <Skeleton className="h-4 w-12 bg-white/20 mt-1" />
            </div>
          </div>
        </div>
      </Card>

      {/* Marine Card Skeleton */}
      <Card className="p-6 bg-[#1E40AF] text-white overflow-hidden relative shadow-md mt-4 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-32 bg-white/20" />
            <Skeleton className="h-4 w-24 bg-white/20 mt-2" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
        </div>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 bg-white/20" />
          </div>
          <Skeleton className="h-4 w-full bg-white/20 mt-3" />
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-6 w-8 bg-white/20" />
              <Skeleton className="h-3 w-16 bg-white/20 mt-1" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-black/20 p-2 sm:p-3 rounded-xl mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-6 w-8 bg-white/20" />
              <Skeleton className="h-3 w-16 bg-white/20 mt-1" />
            </div>
          ))}
        </div>
      </Card>

      {/* Fishing Conditions Card Skeleton */}
      <Card className="p-6 lg:p-8 bg-white dark:bg-card overflow-hidden relative shadow-sm mt-4 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        <div className="mt-4">
          <Tabs defaultValue="inshore">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="inshore">Inshore</TabsTrigger>
              <TabsTrigger value="offshore">Offshore</TabsTrigger>
            </TabsList>
            <TabsContent
              value="inshore"
              className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </TabsContent>
            <TabsContent
              value="offshore"
              className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Marine Data Hourly Cards Skeleton */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-5" />
        </div>

        {/* Wave Height Hourly Card Skeleton */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Skeleton className="h-5 w-5 mr-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-[800px]">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`wave-skeleton-${index}`}
                  className="flex flex-col items-center p-3 bg-blue-50 /20 rounded-lg min-w-[70px]"
                >
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-4 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wind Speed Hourly Card Skeleton */}
        <div>
          <div className="flex items-center mb-2">
            <Skeleton className="h-5 w-5 mr-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-[800px]">
              {Array.from({ length: 24 }).map((_, index) => (
                <div
                  key={`wind-skeleton-${index}`}
                  className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[70px]"
                >
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                  <div className="mt-1 flex items-center">
                    <Skeleton className="h-3 w-4 mr-1" />
                    <Skeleton className="h-3 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-4">
          <Skeleton className="h-4 w-24 mb-1" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-64 mt-1" />
        </div>
      </Card>

      {/* Hourly Forecast Skeleton */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[1200px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`hourly-skeleton-${index}`}
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[90px]"
              >
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-8 w-8 mb-2" />
                <Skeleton className="h-6 w-8 mb-2" />
                <div className="flex items-center mb-1">
                  <Skeleton className="h-3 w-3 mr-1" />
                  <Skeleton className="h-3 w-6" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-3 w-3 mr-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Hourly Precipitation Card Skeleton */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[800px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`precip-skeleton-${index}`}
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[70px]"
              >
                <Skeleton className="h-3 w-12 mb-1" />
                <div className="flex items-center mb-1">
                  <Skeleton className="h-3 w-3 mr-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Weekly Forecast Skeleton */}
      <Card className="p-4 bg-white dark:bg-card shadow-sm rounded-xl">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2 min-w-[800px]">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`day-skeleton-${index}`}
                className="flex flex-col items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0 w-[100px] sm:w-[120px]"
              >
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-5 mb-2" />
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-3 w-3 mr-1" />
                    <Skeleton className="h-3 w-6 mr-1" />
                    <Skeleton className="h-3 w-4" />
                  </div>
                </div>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-3 w-3 mr-1" />
                    <Skeleton className="h-3 w-8 mr-1" />
                    <Skeleton className="h-3 w-4" />
                  </div>
                </div>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-3 w-3 mr-1" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Data Source Information Skeleton */}
      <div className="flex flex-col space-y-2 text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Skeleton className="h-3 w-3 mr-1" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
};

export default WeatherWidgetProSkeleton;
