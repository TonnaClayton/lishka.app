import React from "react";
import { Fish, MapPin, Ruler, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageMetadata } from "@/lib/image-metadata";

interface FishInfoOverlayProps {
  metadata: ImageMetadata;
  className?: string;
}

const FishInfoOverlay: React.FC<FishInfoOverlayProps> = ({
  metadata,
  className = "",
}) => {
  const { fishInfo, location } = metadata;

  // Don't render if no fish info or location
  if (!fishInfo && !location) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none ${className}`}
    >
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {/* Fish Information */}
        {fishInfo && fishInfo.name !== "Unknown" && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <Fish className="w-4 h-4" />
              <span className="font-semibold text-lg">{fishInfo.name}</span>
              {fishInfo.confidence > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 text-xs"
                >
                  {Math.round(fishInfo.confidence * 100)}% confident
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {fishInfo.estimatedSize &&
                fishInfo.estimatedSize !== "Unknown" && (
                  <div className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    <span>{fishInfo.estimatedSize}</span>
                  </div>
                )}

              {fishInfo.estimatedWeight &&
                fishInfo.estimatedWeight !== "Unknown" && (
                  <div className="flex items-center gap-1">
                    <Weight className="w-3 h-3" />
                    <span>{fishInfo.estimatedWeight}</span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Location Information */}
        {location && (
          <div className="flex items-center gap-2 text-sm opacity-90">
            <MapPin className="w-3 h-3" />
            <span>
              {location.address ||
                `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FishInfoOverlay;
