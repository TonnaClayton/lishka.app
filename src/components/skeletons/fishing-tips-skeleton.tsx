import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

const FishingTipsSkeleton: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-2 w-8 rounded-full" />
            <Skeleton className="h-2 w-8 rounded-full" />
            <Skeleton className="h-2 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FishingTipsSkeleton;
