import React from "react";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2 } from "lucide-react";

interface FishingConditionsProps {
  fishingAdvice: any;
  isLoadingFishingAdvice: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const FishingConditions: React.FC<FishingConditionsProps> = ({
  fishingAdvice,
  isLoadingFishingAdvice,
  activeTab,
  setActiveTab,
}) => {
  return (
    <Card className="p-6 lg:p-8 bg-white dark:bg-card overflow-hidden relative shadow-sm mt-4 rounded-xl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold dark:text-white">
            Fishing Conditions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-Generated Advice
          </p>
        </div>
        <div></div>
      </div>

      <div className="mt-4">
        <Tabs
          defaultValue="inshore"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="inshore">Inshore</TabsTrigger>
            <TabsTrigger value="offshore">Offshore</TabsTrigger>
          </TabsList>

          <TabsContent
            value="inshore"
            className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
          >
            {isLoadingFishingAdvice ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-lishka-blue" />
              </div>
            ) : fishingAdvice?.inshore ? (
              <p className="text-sm">{fishingAdvice.inshore}</p>
            ) : (
              <p className="text-sm italic">
                No inshore fishing advice available
              </p>
            )}
          </TabsContent>

          <TabsContent
            value="offshore"
            className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
          >
            {isLoadingFishingAdvice ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-lishka-blue" />
              </div>
            ) : fishingAdvice?.offshore ? (
              <p className="text-sm">{fishingAdvice.offshore}</p>
            ) : (
              <p className="text-sm italic">
                No offshore fishing advice available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
