import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api";
import {
  getHabitatDescription,
  getDifficultyFromProfile,
} from "@/lib/fish-categories";

// ---------------------------------------------------------------------------
// Types — match the backend GET /fish/browse response shape
// ---------------------------------------------------------------------------

/** Raw item returned by the backend API */
interface BrowseFishApiItem {
  id: string;
  scientificName: string;
  commonName: string;
  specCode: number;
  waterType: string | null;
  image: string | null;
  family: string | null;
  isToxic: boolean;
  isRecreationallyAccessible: boolean;
  toxicToEat: boolean;
  isVenomous: boolean;
  hazardousToHandle: boolean;
  isProtected: boolean;
  protectionDetails: string | null;
  riskBadge: string | null;
  habitats: string[];
  depthBands: string[];
  techniques: string[];
  catchProfile: string | null;
  catchRarity: string | null;
  feedingStyles: string[];
  flaggedForReview: boolean;
}

interface BrowseFishApiResponse {
  data: BrowseFishApiItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Item consumed by frontend components (FishCard-compatible) */
export interface BrowseFishItem {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  difficulty: string;
  image?: string;
  slug: string;
  isToxic: boolean;
  dangerType?: string;
  riskBadge?: string | null;
  habitats: string[];
  depthBands: string[];
  techniques: string[];
  catchProfile: string | null;
  catchRarity: string | null;
  feedingStyles: string[];
  freshwaterHabitats: string[];
  flaggedForReview: boolean;
}

export interface BrowseFilters {
  habitats?: string;
  depthBands?: string;
  techniques?: string;
  catchProfile?: string;
  catchRarity?: string;
  feedingStyles?: string;
  freshwaterHabitats?: string;
  /** User latitude — backend resolves to country for geographic scoping */
  latitude?: number;
  /** User longitude — backend resolves to country for geographic scoping */
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(scientificName: string): string {
  return scientificName.toLowerCase().replace(/\s+/g, "-");
}

function mapApiItemToFishItem(item: BrowseFishApiItem): BrowseFishItem {
  const { label: difficulty } = getDifficultyFromProfile(item.catchProfile);
  const habitat = getHabitatDescription(item.habitats) || item.waterType || "";

  return {
    id: item.id,
    name: item.commonName || item.scientificName,
    scientificName: item.scientificName,
    habitat,
    difficulty,
    image: item.image || undefined,
    slug: generateSlug(item.scientificName),
    isToxic: item.isToxic,
    dangerType: undefined,
    riskBadge: item.riskBadge,
    habitats: item.habitats,
    depthBands: item.depthBands,
    techniques: item.techniques,
    catchProfile: item.catchProfile,
    catchRarity: item.catchRarity,
    feedingStyles: item.feedingStyles,
    freshwaterHabitats: [],
    flaggedForReview: item.flaggedForReview || false,
  };
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const browseQueryKeys = {
  browse: (filters: BrowseFilters) => ["browseFish", filters] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches fish from the GET /fish/browse endpoint with category-based filters.
 * Supports infinite scroll pagination.
 */
export const useBrowseFish = (filters: BrowseFilters) => {
  const queryKey = browseQueryKeys.browse(filters);

  const hasActiveCategoryFilter = Object.entries(filters).some(
    ([k, v]) =>
      k !== "latitude" && k !== "longitude" && v !== undefined && v !== "",
  );

  return useInfiniteQuery<BrowseFishItem[]>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: "20",
      });

      // Append category + geographic filters
      for (const [key, value] of Object.entries(filters)) {
        if (value != null && value !== "") {
          params.set(key, String(value));
        }
      }

      const res = await api<BrowseFishApiResponse>(
        `fish/browse?${params.toString()}`,
        { method: "GET" },
      );

      return res.data.map(mapApiItemToFishItem);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    select: (data) => {
      const flat = data.pages.flat();

      // De-duplicate by scientific name
      const seen = new Set<string>();
      const unique: BrowseFishItem[] = [];
      for (const fish of flat) {
        const key = fish.scientificName.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(fish);
        }
      }

      return { ...data, pages: [unique] };
    },
    initialPageParam: 1,
    enabled: hasActiveCategoryFilter,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
