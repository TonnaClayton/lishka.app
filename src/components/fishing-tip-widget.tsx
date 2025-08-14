import React from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface FishingTipWidgetProps {
  location?: string;
  tip?: string;
  model?: string;
}

const FishingTipWidget: React.FC<FishingTipWidgetProps> = ({
  tip = "Try using brightly colored lures to attract fish in clear waters.",
  model = "gpt-3.5-turbo",
}) => {
  return (
    <Card className="bg-white shadow-sm border-0 overflow-hidden mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 rounded-full p-2 mt-1">
            <Lightbulb className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">
              Fishing Tip of the Day
            </h3>
            <p className="text-gray-700 text-sm">{tip}</p>
            <p className="text-xs text-gray-500 mt-2">
              Powered by OpenAI {model}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FishingTipWidget;
