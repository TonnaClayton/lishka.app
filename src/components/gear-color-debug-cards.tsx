import React from "react";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

const GearColorDebugCards: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Gear Color Debug Cards
      </h1>

      {/* Score Badge Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Score Badge Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Excellent Score */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-green-500 text-white">
              95
            </div>
            <div>
              <p className="text-sm font-medium">Excellent (90+)</p>
              <p className="text-xs text-gray-500">Perfect match</p>
            </div>
          </div>

          {/* Good Score */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-blue-500 text-white">
              85
            </div>
            <div>
              <p className="text-sm font-medium">Very Good (80-89)</p>
              <p className="text-xs text-gray-500">Great choice</p>
            </div>
          </div>

          {/* Fair Score */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-yellow-500 text-white">
              75
            </div>
            <div>
              <p className="text-sm font-medium">Good (70-79)</p>
              <p className="text-xs text-gray-500">Suitable</p>
            </div>
          </div>

          {/* Poor Score */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-red-500 text-white">
              45
            </div>
            <div>
              <p className="text-sm font-medium">Poor (less than 60)</p>
              <p className="text-xs text-gray-500">Not ideal</p>
            </div>
          </div>

          {/* No Score */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-gray-400 text-white">
              --
            </div>
            <div>
              <p className="text-sm font-medium">No Score</p>
              <p className="text-xs text-gray-500">Not analyzed</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Card Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Card Examples</h2>

        {/* Top Recommendation Card */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">
            Top Recommendation (Score 80+)
          </p>
          <div className="flex items-center gap-4 p-4 rounded-xl border min-w-[280px] h-24 relative bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 border-blue-300 dark:border-blue-600">
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-lg">
              85
            </div>
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">Premium Jig</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Jigging & Vertical
              </p>
              <p className="text-sm text-lishka-blue  font-medium">
                Perfect for current conditions
              </p>
            </div>
          </div>
        </div>

        {/* Regular Card */}
        <div>
          <p className="text-sm font-medium mb-2">
            Regular Recommendation (Score less than 80)
          </p>
          <div className="flex items-center gap-4 p-4 rounded-xl border min-w-[280px] h-24 relative bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-lg">
              65
            </div>
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">Standard Lure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Casting & Retrieving
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Moderate suitability
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Color Palette */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center">
            <div className="w-full h-12 bg-green-500 rounded-lg mb-2"></div>
            <p className="text-xs">Green (90+)</p>
          </div>
          <div className="text-center">
            <div className="w-full h-12 bg-blue-500 rounded-lg mb-2"></div>
            <p className="text-xs">Blue (80-89)</p>
          </div>
          <div className="text-center">
            <div className="w-full h-12 bg-yellow-500 rounded-lg mb-2"></div>
            <p className="text-xs">Yellow (70-79)</p>
          </div>
          <div className="text-center">
            <div className="w-full h-12 bg-orange-500 rounded-lg mb-2"></div>
            <p className="text-xs">Orange (60-69)</p>
          </div>
          <div className="text-center">
            <div className="w-full h-12 bg-red-500 rounded-lg mb-2"></div>
            <p className="text-xs">Red (less than 60)</p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 /20">
        <h3 className="font-semibold mb-2">About Grey Circles</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The grey circles with "--" on gear cards appear when AI hasn't
          generated scores yet. Once analyzed, they show colored badges with
          numerical scores.
        </p>
      </Card>
    </div>
  );
};

export default GearColorDebugCards;
