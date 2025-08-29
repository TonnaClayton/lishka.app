import { useQuery } from "@tanstack/react-query";
import {
  getFishImageUrl as getFishImageUrlFromService,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import { log } from "@/lib/logging";
import { api } from "../api";
import z from "zod";
import { fishSchema } from "./type";

// Types for fish details
export interface FishingGear {
  rods?: string;
  reels?: string;
  line?: string;
  leader?: string;
  bait?: string[];
  lures?: string[];
  depth?: string;
  jigType?: string;
  jigWeight?: string;
  jigColor?: string;
  rodType?: string;
  reelType?: string;
  hookSize?: string;
  rigType?: string;
  weight?: string;
  lureType?: string;
  lureSize?: string;
  lureColor?: string;
  trollingSpeed?: string;
  [key: string]: any;
}

export interface FishingMethod {
  title?: string;
  method?: string;
  description?: string;
  gear?: FishingGear;
  proTip?: string;
  [key: string]: any;
}

export interface FishingRegulations {
  sizeLimit: {
    value: string;
    source: string;
    confidence: string;
  };
  bagLimit: {
    value: string;
    source: string;
    confidence: string;
  };
  seasonDates: {
    value: string;
    source: string;
    confidence: string;
  };
  licenseRequired: {
    value: string;
    source: string;
    confidence: string;
  };
  additionalRules: Array<{
    rule: string;
    source: string;
    confidence: string;
  }>;
  penalties: {
    value: string;
    source: string;
    confidence: string;
  };
  lastUpdated: string;
  validationFlags?: {
    suspiciousSourcesDetected: boolean;
    genericSourcesReplaced: boolean;
    confidenceDowngraded: boolean;
  };
  lastValidated?: string;
}

export interface FishingSeasons {
  inSeason: string[];
  traditionalSeason: string[];
  conservationConcerns: string;
  regulations: string;
  notInSeason: string[];
  reasoning: string;
}

export interface FishDetails {
  name: string;
  scientificName: string;
  description: string;
  image?: string;
  fishingMethods?: FishingMethod[];
  fishingSeasons?: FishingSeasons;
  fishingRegulations?: FishingRegulations;
  allRoundGear?: FishingGear;
  localNames?: string[];
  currentSeasonStatus?: string;
  officialSeasonDates?: string;
  fishingLocation?: string;
  isToxic?: boolean;
  dangerType?: string;
}

// React Query hook for fish details
export const useFishDetails = (slug: string) => {
  return useQuery({
    queryKey: ["fishDetails", slug],
    queryFn: async () => {
      //   fetchFishDetails(fishName, location, initialData)

      const data = await api<{
        data: z.infer<typeof fishSchema>;
      }>("fish/" + slug, {
        method: "GET",
      });

      console.log("[FISHING TIPS]", data);

      return data.data;
    },
    enabled: !!slug,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// React Query hook for fish image
export const useFishImage = (
  fishName: string,
  scientificName: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["fishImage", fishName, scientificName],
    queryFn: async () => {
      try {
        const imageUrl = await getFishImageUrlFromService(
          fishName,
          scientificName,
        );
        return imageUrl;
      } catch (error) {
        log(`Error loading fish image:`, error);
        return getPlaceholderFishImage();
      }
    },
    enabled: enabled && !!fishName,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    retry: 1,
  });
};
