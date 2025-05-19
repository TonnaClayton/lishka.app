import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  handleFishImageError,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import { Waves, Calendar, Trophy } from "lucide-react";

interface FishCardProps {
  image?: string;
  name?: string;
  scientificName?: string;
  localName?: string;

  habitat?: string;
  difficulty?: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season?: string;
  isToxic?: boolean;

  onClick?: () => void;
}

const FishCard = ({
  image = "https://images.unsplash.com/photo-1545816250-3ea6e37da790?w=400&q=80",
  name = "Atlantic Salmon",
  scientificName = "Salmo salar",
  localName,

  habitat = "Freshwater, Coastal",
  difficulty = "Intermediate",
  season = "Spring, Summer",
  isToxic = false,

  onClick = () => {},
}: FishCardProps) => {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col h-full border-0 shadow bg-white"
      onClick={onClick}
    >
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        {/* Using aspect ratio for consistent 3:2 ratio */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log(`Image error for ${name}: ${e.currentTarget.src}`);
            // Try to load from scientific name regardless of current image source
            // Use default error handler
            handleFishImageError(e, name);
          }}
        />
      </div>
      <CardContent className="p-3 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1">
            <h3 className="font-inter text-base font-bold text-foreground pr-6 line-clamp-1">
              {name}
            </h3>
            {localName ? (
              <p className="text-primary text-xs font-medium">{localName}</p>
            ) : null}
            <p className="text-muted-foreground text-xs italic">
              {scientificName}
            </p>
          </div>
          {isToxic && (
            <Badge variant="destructive" className="ml-1 shrink-0 text-xs py-0">
              Toxic
            </Badge>
          )}
        </div>

        <div className="text-xs mt-auto space-y-1.5">
          <div className="flex items-center">
            <Waves className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5" />
            <span className="text-foreground line-clamp-1">{habitat}</span>
          </div>

          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 text-green-500 dark:text-green-400 mr-1.5" />
            <span className="text-foreground line-clamp-1">{season}</span>
          </div>

          <div className="flex items-center">
            <Trophy className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400 mr-1.5" />
            <span className="text-foreground line-clamp-1">{difficulty}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FishCard;
