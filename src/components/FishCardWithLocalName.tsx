import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  handleFishImageError,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";

interface FishCardWithLocalNameProps {
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

const FishCardWithLocalName = ({
  image = "https://images.unsplash.com/photo-1545816250-0c13b5b7c5d9?w=800&q=80",
  name = "Atlantic Salmon",
  scientificName = "Salmo salar",
  localName,

  habitat = "Freshwater, Coastal",
  difficulty = "Intermediate",
  season = "Spring, Summer",
  isToxic = false,

  onClick = () => {},
}: FishCardWithLocalNameProps) => {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg bg-white flex flex-col h-full border-0 shadow"
      onClick={onClick}
    >
      <div className="relative w-full h-36 overflow-hidden">
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
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-inter text-base font-bold text-foreground pr-6 line-clamp-1">
              {name}
            </h3>
            {/* Removed local name display */}
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

        <div className="text-xs mt-1 pr-5 space-y-1.5">
          <div className="flex items-center">
            <span className="text-blue-500 dark:text-blue-400 mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M2 12h20" />
                <path d="M2 12c0-3.5 2.5-6 6-6 5 0 4 6 10 6s5-3 5-3" />
                <path d="M22 12c0 3.5-2.5 6-6 6-5 0-4-6-10-6s-5 3-5 3" />
              </svg>
            </span>
            <span className="text-foreground line-clamp-1">{habitat}</span>
          </div>

          <div className="flex items-center">
            <span className="text-green-500 dark:text-green-400 mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </span>
            <span className="text-foreground line-clamp-1">{season}</span>
          </div>

          <div className="flex items-center mt-1">
            <span className="text-orange-500 dark:text-orange-400 mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
                <path d="M14 14.66V17c0 .55.47 1 1 1h2c.55 0 1-.45 1-1v-2.34" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M12 16v6" />
              </svg>
            </span>
            <span className="text-foreground line-clamp-1">{difficulty}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FishCardWithLocalName;
