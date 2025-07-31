import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

const ToxicFishSkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 px-4 lg:px-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex-shrink-0 w-40">
          <Card className="overflow-hidden h-full">
            <div className="relative w-full aspect-[3/2] overflow-hidden">
              <Skeleton className="w-full h-full" />
              <div className="absolute bottom-2 right-2">
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
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
        </div>
      ))}
    </div>
  );
};

export default ToxicFishSkeleton;
