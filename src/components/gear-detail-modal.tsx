import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Package, X } from "lucide-react";

interface GearItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  model?: string;
  price?: string;
  gearType?: string;
  size?: string;
  weight?: string;
  targetFish?: string;
  fishingTechnique?: string;
  weatherConditions?: string;
  waterConditions?: string;
  seasonalUsage?: string;
  colorPattern?: string;
  actionType?: string;
  depthRange?: string;
  versatility?: string;
  compatibleGear?: string;
}

interface AIRecommendation {
  gearId: string;
  score: number;
  reasoning: string;
  suitabilityForConditions: string;
}

interface GearDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  gear: GearItem | null;
  recommendation?: AIRecommendation | null;
}

const GearDetailModal: React.FC<GearDetailModalProps> = ({
  isOpen,
  onClose,
  gear,
  recommendation = null,
}) => {
  if (!gear) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Header with close button */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b p-4 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {gear.name}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Gear Image */}
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {gear.imageUrl ? (
                <img
                  src={gear.imageUrl}
                  alt={gear.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}

              {/* AI Score Badge */}
              {recommendation && recommendation.score !== null ? (
                <div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                    recommendation.score >= 90
                      ? "bg-green-500 text-white"
                      : recommendation.score >= 80
                        ? "bg-blue-500 text-white"
                        : recommendation.score >= 70
                          ? "bg-yellow-500 text-white"
                          : recommendation.score >= 60
                            ? "bg-orange-500 text-white"
                            : "bg-red-500 text-white"
                  }`}
                >
                  AI Score: {recommendation.score}
                </div>
              ) : null}
            </div>

            {/* AI Recommendation - Only show if available */}
            {recommendation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-3">
                  AI Analysis for Current Conditions
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-blue-600 dark:text-blue-300 text-xs font-medium mb-1">
                      Reasoning:
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {recommendation.reasoning}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-600 dark:text-blue-300 text-xs font-medium mb-1">
                      Suitability:
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {recommendation.suitabilityForConditions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
              <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                      Category:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {gear.category}
                    </span>
                  </div>

                  {gear.gearType && (
                    <div className="flex justify-between">
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                        Type:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {gear.gearType}
                      </span>
                    </div>
                  )}

                  {gear.brand && (
                    <div className="flex justify-between">
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                        Brand:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {gear.brand}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {gear.model && (
                    <div className="flex justify-between">
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                        Model:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {gear.model}
                      </span>
                    </div>
                  )}

                  {gear.price && (
                    <div className="flex justify-between">
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                        Price:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {gear.price}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specifications */}
            {(gear.size ||
              gear.weight ||
              gear.colorPattern ||
              gear.actionType) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {gear.size && (
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                          Size:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {gear.size}
                        </span>
                      </div>
                    )}

                    {gear.weight && (
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                          Weight:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {gear.weight}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {gear.colorPattern && (
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                          Color:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {gear.colorPattern}
                        </span>
                      </div>
                    )}

                    {gear.actionType && (
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                          Action:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {gear.actionType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fishing Details */}
            {(gear.targetFish || gear.fishingTechnique || gear.depthRange) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                  Fishing Details
                </h3>
                <div className="space-y-4">
                  {gear.targetFish && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Target Fish:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.targetFish}
                      </p>
                    </div>
                  )}

                  {gear.fishingTechnique && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Technique:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.fishingTechnique}
                      </p>
                    </div>
                  )}

                  {gear.depthRange && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Depth Range:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.depthRange}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditions */}
            {(gear.weatherConditions ||
              gear.waterConditions ||
              gear.seasonalUsage) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                  Conditions
                </h3>
                <div className="space-y-4">
                  {gear.weatherConditions && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Weather:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.weatherConditions}
                      </p>
                    </div>
                  )}

                  {gear.waterConditions && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Water:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.waterConditions}
                      </p>
                    </div>
                  )}

                  {gear.seasonalUsage && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Season:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.seasonalUsage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {(gear.versatility || gear.compatibleGear) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {gear.versatility && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Versatility:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.versatility}
                      </p>
                    </div>
                  )}

                  {gear.compatibleGear && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs font-medium block mb-1">
                        Compatible Gear:
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {gear.compatibleGear}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {gear.description && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <h3 className="text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {gear.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GearDetailModal;
