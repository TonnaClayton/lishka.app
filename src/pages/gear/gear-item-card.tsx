import { GearItem } from "@/lib/gear";
import React, { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { ROUTES } from "@/lib/routing";
import { captureEvent } from "@/lib/posthog";

export default function GearItemCard({
  gear,
  categoryId,
  handleDeleteGear,
  loading,
}: {
  gear: GearItem;
  categoryId: string;
  handleDeleteGear: () => void;
  loading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handleExpandCard = () => {
    setIsExpanded(!isExpanded);
    captureEvent("gear_item_card_expanded", {
      gear_id: gear.id,
      gear_category: gear.category,
      gear_name: gear.name,
    });
    setTimeout(() => {
      cardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div
      key={gear.id}
      ref={cardRef}
      className={cn(
        `bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer overflow-hidden`,
        isExpanded ? "p-6 transition-all duration-300 ease-in-out" : "p-4",
      )}
      onClick={handleExpandCard}
    >
      {!isExpanded ? (
        // Compact Card View
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
            <img
              src={gear.imageUrl}
              alt={gear.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[#191B1F] text-base sm:text-lg leading-tight line-clamp-1">
              {gear.name}
            </h4>
            {gear.brand && (
              <p className="text-sm text-[#191B1FCC] font-normal mb-2 leading-tight line-clamp-1">
                {gear.brand}
                {gear.model && ` ${gear.model}`}
              </p>
            )}

            {/* Main info badges */}
            <div className="flex flex-wrap gap-1 sm:gap-2 overflow-hidden">
              {gear.size && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[60px] sm:max-w-[80px]">
                  {gear.size}
                </span>
              )}
              {gear.weight && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[60px] sm:max-w-[80px]">
                  {gear.weight}
                </span>
              )}
              {gear.targetFish && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[80px] sm:max-w-[100px]">
                  {gear.targetFish.split(",")[0].trim()}
                  {gear.targetFish.includes(",") && "..."}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 sm:p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                  <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    //handleEditGear(index);
                    navigate(ROUTES.GEAR_DETAIL.replace(":gearId", gear.id));
                    captureEvent("gear_edit_clicked", {
                      gear_id: gear.id,
                      gear_category: gear.category,
                      gear_name: gear.name,
                    });
                  }}
                  className="cursor-pointer"
                  disabled={loading}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGear();
                    captureEvent("gear_delete_clicked", {
                      gear_id: gear.id,
                      gear_category: gear.category,
                      gear_name: gear.name,
                    });
                  }}
                  className="cursor-pointer text-red-600"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        // Expanded Card View
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <h3 className="text-xl font-bold text-[#191B1F] mb-1 break-words">
                {gear.name}
              </h3>
              {gear.brand && (
                <p className="text-[#191B1FCC] font-normal mb-3 break-words">
                  {gear.brand}
                  {gear.model && ` ${gear.model}`}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 flex items-center justify-center">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(ROUTES.GEAR_DETAIL.replace(":gearId", gear.id));
                      captureEvent("gear_edit_clicked", {
                        gear_id: gear.id,
                        gear_category: gear.category,
                        gear_name: gear.name,
                      });
                    }}
                    className="cursor-pointer"
                    disabled={loading}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGear();
                      captureEvent("gear_delete_clicked", {
                        gear_id: gear.id,
                        gear_category: gear.category,
                        gear_name: gear.name,
                      });
                    }}
                    className="cursor-pointer text-red-600"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Large Image */}
          <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-600 max-w-full">
            <img
              src={gear.imageUrl}
              alt={gear.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Detailed Information */}
          <div className="grid grid-cols-1 gap-4 max-w-full overflow-hidden">
            {/* Primary specs */}
            <div className="grid grid-cols-2 gap-3">
              {gear.size && (
                <div
                  className={cn(
                    "bg-[#025DFB0D] p-3 rounded-lg",
                    !gear.weight && "col-span-2",
                  )}
                >
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Size
                  </div>
                  <div className="text-sm font-normal text-lishka-blue-500">
                    {gear.size}
                  </div>
                </div>
              )}
              {gear.weight && (
                <div
                  className={cn(
                    "bg-[#025DFB0D] p-3 rounded-lg",
                    !gear.size && "col-span-2",
                  )}
                >
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Weight
                  </div>
                  <div className="text-sm font-normal text-lishka-blue-500">
                    {gear.weight}
                  </div>
                </div>
              )}
            </div>

            {/* Target Fish */}
            {gear.targetFish && (
              <div className="bg-[#025DFB0D] p-3 rounded-lg">
                <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                  Target Fish
                </div>
                <div className="text-sm font-normal text-lishka-blue-500">
                  {gear.targetFish}
                </div>
              </div>
            )}

            {/* Category-specific Details */}
            <div className="space-y-3">
              {/* Rods & Reels specific fields */}
              {categoryId === "rods-reels" && (
                <>
                  {gear.gearRatio && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Gear Ratio
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.gearRatio}
                      </div>
                    </div>
                  )}
                  {gear.bearings && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Bearings
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.bearings}
                      </div>
                    </div>
                  )}
                  {gear.dragSystem && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Drag System
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.dragSystem}
                      </div>
                    </div>
                  )}
                  {gear.lineCapacity && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Line Capacity
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.lineCapacity}
                      </div>
                    </div>
                  )}
                  {gear.action && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Action
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.action}
                      </div>
                    </div>
                  )}
                  {gear.power && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Power
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.power}
                      </div>
                    </div>
                  )}
                  {gear.lineWeight && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Line Weight
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.lineWeight}
                      </div>
                    </div>
                  )}
                  {gear.lureWeight && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Lure Weight
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.lureWeight}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Accessories specific fields */}
              {categoryId === "accessories" && (
                <>
                  {gear.capacity && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Capacity
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.capacity}
                      </div>
                    </div>
                  )}
                  {gear.compartments && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Compartments
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.compartments}
                      </div>
                    </div>
                  )}
                  {gear.waterResistant && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Water Resistant
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.waterResistant}
                      </div>
                    </div>
                  )}
                  {gear.usage && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Usage
                      </div>
                      <div className="text-sm font-normal text-lishka-blue-500">
                        {gear.usage}
                      </div>
                    </div>
                  )}
                  {gear.durability && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Durability
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.durability}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Bait & Chum specific fields */}
              {categoryId === "bait-chum" && (
                <>
                  {gear.baitType && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Bait Type
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.baitType}
                      </div>
                    </div>
                  )}
                  {gear.scent && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Scent
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.scent}
                      </div>
                    </div>
                  )}
                  {gear.color && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Color
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.color}
                      </div>
                    </div>
                  )}
                  {gear.waterType && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Water Type
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.waterType}
                      </div>
                    </div>
                  )}
                  {gear.technique && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Technique
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.technique}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Electronics specific fields */}
              {categoryId === "electronics" && (
                <>
                  {gear.screenSize && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Screen Size
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.screenSize}
                      </div>
                    </div>
                  )}
                  {gear.frequency && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Frequency
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.frequency}
                      </div>
                    </div>
                  )}
                  {gear.maxDepth && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Max Depth
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.maxDepth}
                      </div>
                    </div>
                  )}
                  {gear.gps && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        GPS
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.gps}
                      </div>
                    </div>
                  )}
                  {gear.accuracy && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Accuracy
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.accuracy}
                      </div>
                    </div>
                  )}
                  {gear.battery && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Battery
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.battery}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Other category specific fields */}
              {categoryId === "other" && (
                <>
                  {gear.insulation && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Insulation
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.insulation}
                      </div>
                    </div>
                  )}
                  {gear.iceRetention && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Ice Retention
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.iceRetention}
                      </div>
                    </div>
                  )}
                  {gear.pockets && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Pockets
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.pockets}
                      </div>
                    </div>
                  )}
                  {gear.fit && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Fit
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.fit}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Lures & Jigs specific fields */}
              {categoryId === "lures-jigs" && (
                <>
                  {gear.fishingTechnique && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Technique
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.fishingTechnique}
                      </div>
                    </div>
                  )}
                  {gear.depthRange && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Depth Range
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.depthRange}
                      </div>
                    </div>
                  )}
                  {gear.colorPattern && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Color Pattern
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.colorPattern}
                      </div>
                    </div>
                  )}
                  {gear.actionType && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Action Type
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.actionType}
                      </div>
                    </div>
                  )}
                  {gear.versatility && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Versatility
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.versatility}
                      </div>
                    </div>
                  )}
                  {gear.compatibleGear && (
                    <div className="bg-[#025DFB0D] p-3 rounded-lg">
                      <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                        Compatible Gear
                      </div>
                      <div className="text-sm text-lishka-blue-500 ">
                        {gear.compatibleGear}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Common fields for all categories */}
              {gear.fishingTechnique && categoryId !== "lures-jigs" && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Fishing Technique
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.fishingTechnique}
                  </div>
                </div>
              )}

              {gear.construction && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Construction
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.construction}
                  </div>
                </div>
              )}

              {gear.material && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Material
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.material}
                  </div>
                </div>
              )}

              {gear.features && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Features
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.features}
                  </div>
                </div>
              )}

              {gear.season && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Season
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.season}
                  </div>
                </div>
              )}

              {/* Standard description fallback */}
              {gear.description && (
                <div className="bg-[#025DFB0D] p-3 rounded-lg">
                  <div className="text-xs font-medium text-lishka-blue uppercase tracking-wide mb-1">
                    Description
                  </div>
                  <div className="text-sm text-lishka-blue-500 ">
                    {gear.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
