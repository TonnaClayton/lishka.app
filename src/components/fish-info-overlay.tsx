import React from "react";
import { Fish, Ruler, Weight, MapPin } from "lucide-react";
import { ImageMetadata } from "@/lib/image-metadata";
import { log } from "@/lib/logging";
import { cn } from "@/lib/utils";

interface FishInfoOverlayProps {
  metadata: ImageMetadata;
  className?: string;
  isSingleColumn?: boolean;
  isMobile?: boolean;
}

const FishInfoOverlay: React.FC<FishInfoOverlayProps> = ({
  metadata,
  className = "",
  isSingleColumn = true,
  isMobile = false,
}) => {
  // Debug logging for metadata
  log("🔍 [FishInfoOverlay] Received metadata:", {
    metadata,
    hasFishInfo: !!metadata?.fishInfo,
    fishInfo: metadata?.fishInfo,
    hasLocation: !!metadata?.location,
    location: metadata?.location,
  });

  // Early return if no metadata
  if (!metadata) {
    log("⚠️ [FishInfoOverlay] No metadata provided");
    return (
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10 ${className}`}
      >
        <div
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
        >
          <div className="flex items-center gap-2 min-h-[24px] mb-4">
            <Fish className="w-4 h-4 text-white flex-shrink-0" />
            <span className="font-semibold text-lg text-white leading-tight">
              No Metadata
            </span>
          </div>
          <div className="">
            <img
              src="/images/Logo.png"
              alt="Lishka Logo"
              style={{
                height: isMobile == true ? "24px" : "32px",
                width: "auto",
                objectFit: "contain",
              }}
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="text-sm font-bold text-white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">LISHKA</div>';
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Extract fish information directly from the AI JSON response
  const fishInfo = metadata.fishInfo;
  const location = metadata.location;

  // Check if we have any valid fish data from the AI response
  const fishName = fishInfo?.name;
  const fishSize = fishInfo?.estimatedSize;
  const fishWeight = fishInfo?.estimatedWeight;
  const confidence = fishInfo?.confidence || 0;

  // Determine what constitutes valid data (not "Unknown" and not empty)
  const hasValidFishName =
    fishName &&
    fishName !== "Unknown" &&
    fishName.trim() !== "" &&
    fishName.toLowerCase() !== "unknown";
  const hasValidFishSize =
    fishSize &&
    fishSize !== "Unknown" &&
    fishSize.trim() !== "" &&
    fishSize.toLowerCase() !== "unknown";
  const hasValidFishWeight =
    fishWeight &&
    fishWeight !== "Unknown" &&
    fishWeight.trim() !== "" &&
    fishWeight.toLowerCase() !== "unknown";
  const hasValidLocation = location?.address && location.address.trim() !== "";

  // Check if we have ANY useful fish data from the AI
  const hasAnyFishData =
    hasValidFishName || hasValidFishSize || hasValidFishWeight;
  const shouldShowConfidence =
    hasValidFishName && confidence > 0 && !metadata.userConfirmed;

  // Debug logging for fish data validation
  log("🔍 [FishInfoOverlay] Fish data validation:", {
    fishName,
    fishSize,
    fishWeight,
    confidence,
    hasValidFishName,
    hasValidFishSize,
    hasValidFishWeight,
    hasAnyFishData,
    shouldShowConfidence,
  });

  return (
    <>
      <div
        className={cn(
          `absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10 `,
          className
        )}
      >
        <div
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
        >
          {/* Fish Information Section */}
          <div
            className={cn(
              "flex flex-col mb-4",
              isMobile == true ? "gap-0.5" : "gap-3"
            )}
          >
            {hasAnyFishData ? (
              <>
                {/* Fish Name with Confidence */}
                {hasValidFishName ? (
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-h-[24px]">
                      <Fish className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="font-semibold text-lg text-white leading-tight">
                        {fishName}
                      </span>
                    </div>
                    {shouldShowConfidence && (
                      <div className="bg-white/20 text-white border border-white/30 text-xs px-2 py-1 rounded-md flex items-center justify-center h-6">
                        {Math.round(confidence * 100)}% confident
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show "Fish Detected" when we have size/weight but no name */
                  <div className="flex items-center gap-2 min-h-[24px]">
                    <Fish className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="font-semibold text-lg text-white leading-tight">
                      Fish Detected
                    </span>
                  </div>
                )}

                {/* Size and Weight Details */}
                <div
                  className={cn(
                    "flex flex-col text-sm",
                    isMobile == true ? "gap-0.5" : "gap-2"
                  )}
                >
                  {hasValidFishSize && (
                    <div className="flex items-center gap-2 min-h-[20px]">
                      <Ruler className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-white leading-tight">
                        Size: {fishSize}
                      </span>
                    </div>
                  )}

                  {hasValidFishWeight && (
                    <div className="flex items-center gap-2 min-h-[20px]">
                      <Weight className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-white leading-tight">
                        Weight: {fishWeight}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Show "AI Analysis Failed" when fishInfo exists but contains no valid data */

              <div className="flex items-center gap-2 min-h-[24px]">
                <Fish className="w-4 h-4 text-white flex-shrink-0" />
                <span className="font-semibold text-lg text-white leading-tight">
                  {fishInfo ? "AI Analysis Failed" : "AI Info Missing"}
                </span>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="relative z-20">
            <img
              src="/images/Logo.png"
              alt="Lishka Logo"
              style={{
                height: isMobile == true ? "24px" : "32px",
                width: "auto",
                objectFit: "contain",
              }}
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="text-sm font-bold text-white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">LISHKA</div>';
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FishInfoOverlay;
