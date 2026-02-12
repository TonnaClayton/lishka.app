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
  image = "https://images.unsplash.com/photo-1545816250-3ea6e37da790?w=400&q=80",
  name = "Atlantic Salmon",
  scientificName = "Salmo salar",
  habitat = "Freshwater, Coastal",
  difficulty = "Intermediate",
  isToxic = false,
  dangerType,
  className,

  onClick = () => {},
}: FishCardProps) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>(image);
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

    // Only load if we don't already have a good image URL
    if (!image || image.includes("unsplash") || image.includes("placeholder")) {
      log(`FishCard: Loading new image for ${name}, current image:`, image);
      loadFishImage();
    } else {
      log(`FishCard: Using existing image for ${name}:`, image);
      setActualImageUrl(image);
      setImageLoading(false);
    }
  }, [name, scientificName, image]);
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
        "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-none flex flex-col h-full border-0 shadow-none bg-transparent rounded-xl",
        className,
      )}
      onClick={handleClick}
    >
      <div className="relative w-full aspect-[3/2] overflow-hidden max-w-full rounded-xl">
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
      <CardContent className="p-2 sm:p-3 lg:p-4 flex flex-col flex-1">
        <div className="mb-1 lg:mb-2">
          <h3 className="font-inter text-sm sm:text-base lg:text-lg font-bold text-foreground truncate">
            {name}
          </h3>
          <p className="text-muted-foreground text-xs lg:text-sm italic truncate">
            {scientificName}
          </p>
        </div>

        <div className="text-xs lg:text-sm space-y-1 sm:space-y-1.5 lg:space-y-2">
          {isToxic && dangerType ? (
            // For toxic fish, show danger type instead of habitat and difficulty
            <div className="flex items-start">
              <span className="text-foreground line-clamp-2 text-xs lg:text-sm">
                {dangerType.charAt(0).toUpperCase() + dangerType.slice(1)}
              </span>
            </div>
          ) : (
            // For non-toxic fish, show habitat and difficulty
            <>
              <div className="flex items-center">
                <Waves className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-lishka-blue mr-1 sm:mr-1.5 lg:mr-2 shrink-0" />
                <span className="text-foreground line-clamp-1 text-xs lg:text-sm">
                  {habitat}
                </span>
              </div>

              <div className="flex items-center">
                <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-[#F97316] mr-1 sm:mr-1.5 lg:mr-2 shrink-0" />
                <span className="text-foreground line-clamp-1 text-xs lg:text-sm">
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
