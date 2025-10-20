import React from "react";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";

interface FishingConditionsProps {
  fishingAdvice: {
    inshore?: any;
    offshore?: any;
  };
  isLoadingFishingAdvice: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

interface FishingAdviceJSON {
  summary: string;
  tactics: string[];
  locations: string[];
  targetSpecies: {
    common: string;
    scientific: string;
    note?: string;
  }[];
  gearSuggestions: {
    item: string;
    note: string;
  }[];
  whyItWorks: string[];
  safetyNotes: string[];
}

const parseAdvice = (advice: any): FishingAdviceJSON | null => {
  if (!advice) return null;

  // If it's already an object, return it
  if (typeof advice === "object" && !Array.isArray(advice)) {
    return advice as FishingAdviceJSON;
  }

  // If it's a string, try to parse it as JSON
  if (typeof advice === "string") {
    try {
      const parsed = JSON.parse(advice);
      return parsed as FishingAdviceJSON;
    } catch {
      return null;
    }
  }

  return null;
};

const StructuredAdvice: React.FC<{ advice: FishingAdviceJSON }> = ({
  advice,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary */}
      {advice.summary && (
        <div>
          <p className="text-sm font-medium mb-2">{advice.summary}</p>
        </div>
      )}

      {/* Tactics */}
      {advice.tactics && advice.tactics.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Tactics</h4>
          <ul className="list-disc list-inside space-y-1">
            {advice.tactics.map((tactic, idx) => (
              <li key={idx} className="text-sm">
                {tactic.charAt(0).toUpperCase() + tactic.slice(1)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Locations */}
      {advice.locations && advice.locations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Best Locations</h4>
          <div className="flex flex-wrap gap-2">
            {advice.locations.map((location, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-white dark:bg-gray-700"
              >
                {location.charAt(0).toUpperCase() + location.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Target Species */}
      {advice.targetSpecies && advice.targetSpecies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Target Species</h4>
          <div className="space-y-2">
            {advice.targetSpecies.map((species, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{species.common}</span>
                {species.scientific && (
                  <span className="italic text-gray-600 dark:text-gray-400 ml-1">
                    ({species.scientific})
                  </span>
                )}
                {species.note && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {species.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gear Suggestions */}
      {advice.gearSuggestions && advice.gearSuggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Gear Suggestions</h4>
          <ul className="space-y-2">
            {advice.gearSuggestions.map((gear, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium">{gear.item}</span>
                {gear.note && (
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    - {gear.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Why It Works */}
      {advice.whyItWorks && advice.whyItWorks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Why It Works</h4>
          <ul className="list-disc list-inside space-y-1">
            {advice.whyItWorks.map((reason, idx) => (
              <li key={idx} className="text-sm">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Notes */}
      {advice.safetyNotes && advice.safetyNotes.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
          <h4 className="text-sm font-semibold mb-2 text-yellow-800 dark:text-yellow-300">
            Safety Notes
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {advice.safetyNotes.map((note, idx) => (
              <li
                key={idx}
                className="text-sm text-yellow-800 dark:text-yellow-300"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const FishingConditions: React.FC<FishingConditionsProps> = ({
  fishingAdvice,
  isLoadingFishingAdvice,
  activeTab,
  setActiveTab,
}) => {
  return (
    <Card className="p-6 bg-white dark:bg-card overflow-hidden relative shadow-sm mt-4 rounded-xl">
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
            className="mt-4 bg-[#F7F7F7] text-[#191B1F] p-4 rounded-md"
          >
            {isLoadingFishingAdvice ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-lishka-blue" />
              </div>
            ) : fishingAdvice?.inshore ? (
              (() => {
                const parsedAdvice = parseAdvice(fishingAdvice.inshore);
                return parsedAdvice ? (
                  <StructuredAdvice advice={parsedAdvice} />
                ) : (
                  <p className="text-sm font-normal">{fishingAdvice.inshore}</p>
                );
              })()
            ) : (
              <p className="text-sm font-normal italic">
                No inshore fishing advice available
              </p>
            )}
          </TabsContent>

          <TabsContent
            value="offshore"
            className="mt-4 bg-[#F7F7F7] text-[#191B1F] p-4 rounded-md"
          >
            {isLoadingFishingAdvice ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-lishka-blue" />
              </div>
            ) : fishingAdvice?.offshore ? (
              (() => {
                const parsedAdvice = parseAdvice(fishingAdvice.offshore);
                return parsedAdvice ? (
                  <StructuredAdvice advice={parsedAdvice} />
                ) : (
                  <p className="text-sm font-normal">
                    {fishingAdvice.offshore}
                  </p>
                );
              })()
            ) : (
              <p className="text-sm font-normal italic">
                No offshore fishing advice available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
