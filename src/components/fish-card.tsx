import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  handleFishImageError,
  getPlaceholderFishImage,
  getFishImageUrl,
} from "@/lib/fish-image-service";
import { Waves, Target } from "lucide-react";
import { log } from "@/lib/logging";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";

interface FishCardProps {
  image?: string;
  name?: string;
  scientificName?: string;
  localName?: string;

  habitat?: string;
  difficulty?: string;
  isToxic?: boolean;
  dangerType?: string;
  className?: string;

  onClick?: () => void;
}

const FishCard = ({
  image: _image, // Unused - we start with placeholder to prevent FishBase flash
  name = "Atlantic Salmon",
  scientificName = "Salmo salar",
  habitat = "Freshwater, Coastal",
  difficulty = "Intermediate",
  isToxic = false,
  dangerType,
  className,

  onClick = () => {},
}: FishCardProps) => {
  // Don't use the initial image prop to avoid showing FishBase images
  // Start with placeholder and load the correct image immediately
  const [actualImageUrl, setActualImageUrl] = useState<string>(
    getPlaceholderFishImage(),
  );
  const [imageLoading, setImageLoading] = useState(true);

  // Load the actual fish image on component mount
  useEffect(() => {
    const loadFishImage = async () => {
      try {
        log(`FishCard: Starting image load for ${name} (${scientificName})`);
        setImageLoading(true);
        const fishImageUrl = await getFishImageUrl(name, scientificName);
        log(`FishCard: Got image URL for ${name}:`, fishImageUrl);
        setActualImageUrl(fishImageUrl);
      } catch (error) {
        error(`FishCard: Error loading image for ${name}:`, error);
        setActualImageUrl(getPlaceholderFishImage());
      } finally {
        setImageLoading(false);
      }
    };

    loadFishImage();
  }, [name, scientificName]);
  const handleClick = () => {
    // Track fish card click event
    captureEvent("fish_card_clicked", {
      fish_name: name,
      scientific_name: scientificName,
      is_toxic: isToxic,
      difficulty: difficulty,
      habitat: habitat,
    });
    onClick();
  };

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col h-full border-0 shadow bg-white rounded-xl",
        className,
      )}
      onClick={handleClick}
    >
      <div className="relative w-full aspect-[3/2] overflow-hidden max-w-full">
        {/* Using aspect ratio for consistent 3:2 ratio */}
        {imageLoading && (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-xs">Loading...</div>
          </div>
        )}
        <img
          src={actualImageUrl}
          alt={name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            log(`Image error for ${name}: ${e.currentTarget.src}`);
            setImageLoading(false);
            handleFishImageError(e, name);
          }}
        />
        {isToxic && (
          <Badge
            variant="destructive"
            className="absolute bottom-2 right-2 text-xs py-0 shadow-lg rounded-[32px] bg-[#FF004D] text-white"
          >
            Toxic
          </Badge>
        )}
      </div>
      <CardContent className="p-2 sm:p-3 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="font-inter text-sm sm:text-base font-bold text-foreground truncate">
            {name}
          </h3>
          <p className="text-muted-foreground text-xs italic truncate">
            {scientificName}
          </p>
        </div>

        <div className="text-xs space-y-1 sm:space-y-1.5">
          {isToxic && dangerType ? (
            // For toxic fish, show danger type instead of habitat and difficulty
            <div className="flex items-start">
              <span className="text-foreground line-clamp-2 text-xs">
                {dangerType.charAt(0).toUpperCase() + dangerType.slice(1)}
              </span>
            </div>
          ) : (
            // For non-toxic fish, show habitat and difficulty as before
            <>
              <div className="flex items-center">
                <Waves className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-lishka-blue mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-foreground line-clamp-1 text-xs">
                  {habitat}
                </span>
              </div>

              <div className="flex items-center">
                <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#F97316] mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-foreground line-clamp-1 text-xs">
                  {difficulty}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FishCard;
