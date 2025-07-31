import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

const GearRecommendationSkeleton: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GearRecommendationSkeleton;
